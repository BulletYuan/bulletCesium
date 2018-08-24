/**
 * 测量类
 * @param {handler:Cesium.ScreenSpaceEventHandler,type:Number}
 * @description handler：获取屏幕事件句柄(必需)。type：0为测量距离(默认)，返回单位为米；1为测量面积，返回单位为平方米。
 *  
 */
let Measure=(function(){
  function A(opt){
      opt=opt||{},
      this.handler=opt.handler||null,
      this.type=opt.type||0;

      this.isDraw=false,
      this.positions = [],
      this.points=[],
      this.polys = [],
      this.descs=[];
      this.polygons=[];

      this.init();
  }
  // 初始化测量类
  A.prototype.init=function(){
      if(!this.handler) return false;
      this.removeEvent();
  };
  // 移出原有绑定事件
  A.prototype.removeEvent=function(){
      this.handler.removeInputAction(Cesium.ScreenSpaceEventType.MOUSE_MOVE);
      this.handler.removeInputAction(Cesium.ScreenSpaceEventType.LEFT_CLICK);
      this.handler.removeInputAction(Cesium.ScreenSpaceEventType.LEFT_DOUBLE_CLICK);
      this.removeDesc(this.descs);
      this.removeLine(this.polys);
      this.removePolygon(this.polygons);
  };
  // 摧毁绑定事件
  A.prototype.destroy=function(){
      if(this.handler.isDestroy) this.handler.destroy();
      this.removeDesc(this.descs);
      this.removeLine(this.polys);
      this.removePolygon(this.polygons);
  }
  // 测量距离模块
  A.prototype.measureDistance=function(){
      let _self=this;
      if(_self.type !== 0) return false;
      _self.removeEvent();
      _self.handler.setInputAction((movement)=>{
          if(!_self.isDraw){
              _self.isDraw=true;
              _self.removeLine(_self.polys);
              _self.removeDesc(_self.descs);
          }
          if(_self.positions.length<0) {
              _self.positions.push(_self.getPointInfo(movement));
              _self.points.push(new Cesium.Cartographic(Cesium.Math.toRadians(_self.getPointInfo(movement).x), Cesium.Math.toRadians(_self.getPointInfo(movement).y), _self.getPointInfo(movement).z));
          }
          _self.positions.push(_self.getPointInfo(movement));
          _self.points.push(new Cesium.Cartographic(Cesium.Math.toRadians(_self.getPointInfo(movement).x), Cesium.Math.toRadians(_self.getPointInfo(movement).y), _self.getPointInfo(movement).z));
          _self.points=_self.setLinePoints(_self.positions,_self.points);
          _self.polys.push(_self.addLine(_self.points));
          if(_self.positions.length===1) _self.descs.push(_self.addDesc('起点',_self.positions[_self.positions.length-1]));
      },Cesium.ScreenSpaceEventType.LEFT_CLICK);
      _self.handler.setInputAction(()=>{
          _self.isDraw=false;
          let d=_self.getDistance(_self.positions);
          _self.descs.push(_self.addDesc(d>1000?`${(d/1000).toFixed(2)}km`:`${(d).toFixed(2)}m`,_self.positions[_self.positions.length-1]));
          _self.positions=[],_self.points=[];
          // handler.destroy();
      }, Cesium.ScreenSpaceEventType.LEFT_DOUBLE_CLICK);
  };
  // 测量面积模块
  A.prototype.measureSquare=function(){
      let _self=this;
      if(_self.type !== 1) return false;
      _self.removeEvent();
      _self.handler.setInputAction((movement)=>{
          if(!_self.isDraw){
              _self.isDraw=true;
              _self.removeLine(_self.polys);
              _self.removeDesc(_self.descs);
              _self.removePolygon(_self.polygons);
          }
          if(_self.positions.length<0) {
              _self.positions.push(_self.getPointInfo(movement));
              _self.points.push(new Cesium.Cartographic(Cesium.Math.toRadians(_self.getPointInfo(movement).x), Cesium.Math.toRadians(_self.getPointInfo(movement).y), _self.getPointInfo(movement).z));
          }
          _self.positions.push(_self.getPointInfo(movement));
          _self.points.push(new Cesium.Cartographic(Cesium.Math.toRadians(_self.getPointInfo(movement).x), Cesium.Math.toRadians(_self.getPointInfo(movement).y), _self.getPointInfo(movement).z));
          _self.points=_self.setLinePoints(_self.positions,_self.points);
          _self.polys.push(_self.addLine(_self.points));
          if(_self.positions.length===1) _self.descs.push(_self.addDesc('起点',_self.positions[_self.positions.length-1]));
      },Cesium.ScreenSpaceEventType.LEFT_CLICK);
      _self.handler.setInputAction(()=>{
          _self.isDraw=false;
          let sq=_self.getSquare(_self.positions);
          _self.removeDesc(_self.descs);
          _self.removeLine(_self.polys);
          _self.descs.push(_self.addDesc(sq>1000000?`${(sq/1000000).toFixed(2)}km²`:`${(sq).toFixed(2)}m²`,_self.positions[_self.positions.length-1]));
          _self.polygons.push(_self.addPolygon(_self.points));
          _self.positions=[],_self.points=[];
          // handler.destroy();
      }, Cesium.ScreenSpaceEventType.LEFT_DOUBLE_CLICK);
  };
  //移除画布上的面
  A.prototype.removePolygon=function(polygons){
      if(!polygons||polygons.length<1) return false;
      polygons.forEach(polygon=>{
          viewer.entities.remove(polygon);
      });
  };
  //移除画布上的线
  A.prototype.removeLine=function(polys){
      if(!polys||polys.length<1) return false;
      polys.forEach(poly=>{
          viewer.entities.remove(poly);
      });
  };
  //移除画布上的文字描述
  A.prototype.removeDesc=function(descs){
      if(!descs||descs.length<1) return false;
      descs.forEach(desc=>{
          viewer.entities.remove(desc);
      });
  }
  //添加画布上的面
  A.prototype.addPolygon=function(points){
      if(!points||points.length<1) return false;
      points.push(points[0]);
      return viewer.entities.add({
          polygon : {
              // hierarchy : Cesium.Cartesian3.fromDegreesArrayHeights(points),
              hierarchy : Cesium.Ellipsoid.WGS84.cartographicArrayToCartesianArray(points),
              heightReference:Cesium.HeightReference.RELATIVE_TO_GROUND,
              perPositionHeight : true,
              // extrudedHeight: 800.0,
              material : Cesium.Color.fromRandom({alpha : 0.5})
          }
      });
  }
  //添加画布上的线
  A.prototype.addLine=function(points){
      if(!points||points.length<1) return false;
      return viewer.entities.add({
          polyline: {
              positions: Cesium.Ellipsoid.WGS84.cartographicArrayToCartesianArray(points),
              // 线在视野范围时能看到时的material
              material: new Cesium.PolylineOutlineMaterialProperty({
                  color: Cesium.Color.DEEPSKYBLUE,
                  // color: Cesium.Color.fromRandom({alpha:0.8}),
                  // outlineWidth: 2,
                  // outlineColor: Cesium.Color.SKYBLUE
              }),
              width: 5.0,
              // 线在视野范围看不到时的material
              depthFailMaterial: new Cesium.PolylineOutlineMaterialProperty({
                  color: Cesium.Color.DEEPSKYBLUE,
                  // color: Cesium.Color.fromRandom({alpha:0.8}),
                  // outlineWidth: 2,
                  // outlineColor: Cesium.Color.SKYBLUE
              })
          },
      });
  }
  //添加画布上的文字描述
  A.prototype.addDesc=function(text,position){
      if(!text||!position) return false;
      return viewer.entities.add({
          position:Cesium.Cartesian3.fromDegrees(position.x,position.y,position.z),
          label: {
              heightReference:Cesium.HeightReference.RELATIVE_TO_GROUND,
              text: text,
              font: '16px monospace',
              style : Cesium.LabelStyle.FILL_AND_OUTLINE,
              outlineWidth : 2,
              fillColor:Cesium.Color.RED,
              showBackground:true,
              backgroundColor:Cesium.Color.WHITE.withAlpha(0.6),
              horizontalOrigin: Cesium.HorizontalOrigin.LEFT,
              // pixelOffset : new Cesium.Cartesian2(10, 30)
          },
          point: {
              color : Cesium.Color.RED,
              pixelSize: 5,
              outlineColor: Cesium.Color.WHITE,
              outlineWidth: 2
          },
      });
  }

  //获取点位之间的距离
  A.prototype.getDistance=function(positions){
      if(!positions||positions.length<1) return false;
      distance=0;
      if(typeof positions ==="object"&&positions.length>1){
          for(let i=1;i<positions.length;i++){
              let el=positions[i];
              let oel=positions[i-1];
              var startCartographic = Cesium.Cartographic.fromDegrees(oel.x, oel.y);
              var endCartographic = Cesium.Cartographic.fromDegrees(el.x, el.y);
              
              var geodesic = new Cesium.EllipsoidGeodesic();
              geodesic.setEndPoints(startCartographic, endCartographic);
              distance+=Number((Math.round(geodesic.surfaceDistance)).toFixed(2));
          }
      }
      return distance;
  }
  //获取点位组成的面积
  A.prototype.getSquare=function(positions){
      if(!positions||positions.length<1) return false;
      sq=0;
      if(typeof positions ==="object"&&positions.length>1){
          positions.push(positions[0]);
          let h=0;
          var ellipsoid=viewer.scene.globe.ellipsoid;
          for(let i=1;i<positions.length;i++){
              let el=positions[i];
              let oel=positions[i-1];
              var cartographic=Cesium.Cartographic.fromDegrees(oel.x, oel.y);
              oel=ellipsoid.cartographicToCartesian(cartographic);
              cartographic=Cesium.Cartographic.fromDegrees(el.x, el.y);
              el=ellipsoid.cartographicToCartesian(cartographic);
              h+=(oel.x*el.y-el.x*oel.y);
          }
          sq=Math.abs(h)///2;
      }
      return sq;
  }
  //点与点之间细分点，尽量做到贴地
  A.prototype.setLinePoints=function(positions,points){
      let _self=this;
      if(positions.length>1){
          let bs=[];
          let lon1=positions[positions.length-2].x,lat1=positions[positions.length-2].y;
          let lon2=positions[positions.length-1].x,lat2=positions[positions.length-1].y;
          let sp=_self.getDistance([positions[positions.length-2],positions[positions.length-1]])/1000;
          sp=Math.floor(sp);
          for(let j=1; j<sp; j++) {
              let lon = Cesium.Math.toRadians(Cesium.Math.lerp(lon1, lon2, j / (sp -1)));
              let lat = Cesium.Math.toRadians(Cesium.Math.lerp(lat1, lat2, j / (sp -1)));
              let cartographic = new Cesium.Cartographic(lon, lat);
              var height = viewer.scene.globe.getHeight(cartographic)+10;
              bs.push(new Cesium.Cartographic(lon, lat, height));
          }
          if(bs.length>0){
              points.pop();
              points=points.concat(bs);
          }
      }
      return points;
  }
  //获取点击点的坐标信息
  A.prototype.getPointInfo=function(movement){
      var pick=movement.position? new Cesium.Cartesian2(movement.position.x,movement.position.y):new Cesium.Cartesian2(movement.endPosition.x,movement.endPosition.y);
      var cartesian = viewer.scene.globe.pick(viewer.camera.getPickRay(pick), viewer.scene);
      var cartographic = viewer.scene.globe.ellipsoid.cartesianToCartographic(cartesian);
      var height = viewer.scene.globe.getHeight(cartographic);
      height=height<0?Math.abs(height):height;
      var he = Math.sqrt(viewer.scene.camera.positionWC.x * viewer.scene.camera.positionWC.x + viewer.scene.camera.positionWC.y * viewer.scene.camera.positionWC.y + viewer.scene.camera.positionWC.z * viewer.scene.camera.positionWC.z);
      var he2 = Math.sqrt(cartesian.x * cartesian.x + cartesian.y * cartesian.y + cartesian.z * cartesian.z);
      //地理坐标（弧度）转经纬度坐标
      var point=[ cartographic.longitude / Math.PI * 180, cartographic.latitude / Math.PI * 180];
      // console.log("视角海拔高度:"+(he - he2).toFixed(2)+"米\n海拔:"+height.toFixed(2)+"米\n经度：" + point[0] + " 纬度：" + point[1]);
      return {
          x:Number(point[0].toFixed(6)),
          y:Number(point[1].toFixed(6)),
          z:Number(height.toFixed(2))+10,
      }
  }
  return A;
})();
/**
 * 剖切类
 * @param {handler:Cesium.ScreenSpaceEventHandler,radarNf:Object,colorMap:Object,parentDoc:Object,VCSImageViewer:Object}
 * @description handler：获取屏幕事件句柄(必需)。radarNf：雷达体扫文件生成的data对象。colorMap：需要的色标卡对象。parentDoc：父级上下文档。VCSImageViewer：VCS图像对话框。
 *  
 */
let Splice=(function(){
    let intersection = new Cesium.Cartesian3(),
     intersectionLocal = new Cesium.Cartesian3(),
     intersectionPolar = {
        azimuth: 0,
        elevation: 0,
        radius: 0
     },
     intersectCartographic = new Cesium.Cartographic(),
     scratchPixels,
     scratchVerticalPixels,
	 
	 CoordinateHelper = MeteoLib.Data.Radar.CoordinateHelper,
	 MyLatLng = MeteoLib.Data.Radar.MyLatLng,
	 GridDataColorMap = MeteoLib.Render.GridDataColorMap,
	 RadarMaterial = MeteoLib.Render.RadarMaterial,
	 MeshVisualizer = MeteoLib.Render.MeshVisualizer
	 Mesh = MeteoLib.Render.Mesh,
	 RadarNetFormat = MeteoLib.Data.Radar.RadarNetFormat,
	 PlaneBufferGeometry = MeteoLib.Render.PlaneBufferGeometry,
	 FramebufferTexture = MeteoLib.Render.FramebufferTexture,
	 ImageUtil = MeteoLib.Util.ImageUtil,
	 VectorLayer = MeteoLib.Render.VectorLayer;
    function A(opt){
        opt=opt||{};
        if(!opt.radarNf||!opt.radarNf.Header||!opt.handler) return false;
        this.handler=opt.handler,
        this.radarNf=opt.radarNf;
        this.colorMap=opt.colorMap||null;
        this.VCSImageViewer=opt.VCSImageViewer||null;
        this.parentDoc=opt.parentDoc||null;
        
        this.position={};
        this.position.left = 0;
        this.position.top = 0;
        this.station={};
        this.size={
            width:document.body.clientWidth - 30,
            height:document.body.clientHeight - 30,
        };

        this.currentRadarLayerIndex = 0;
        this.currentBandNo = 0;
        this.ready = true;

        this.sliceMaterial = null;
        this.radarMaterials = [];
        this.sliceFramebuffer = null;

        this.cappiViewport = { x: 0, y: 0, width: 1024, height: 1024 };
        this.verticalViewport = { x: 0, y: 0, width: 460, height: 310 };
        this.weatherRadarSpace;

        this.rectangle = new Cesium.Rectangle();
        this.viewRectangle = new Cesium.Rectangle();
        this.projection = new Cesium.WebMercatorProjection();//GeographicProjection();

        this.meshVisualizers=[];
        this.viewer=window.viewer;
        /**
         *@type {ModuleViewer}
        */
        this.RHIImageViewer = null;
        /**
        *@type {ModuleViewer}
        */
        // this.VCSImageViewer = null;
        /**
        *@type {ModuleViewer}
        */
       this.settingsViewer = null;
       this.ingoreInvalidValue = true;
       this.walls=[];

       this.init(opt.radarNf);
    };
    A.prototype.init=function(radarNf){
        if(!this.radarNf||!this.radarNf.Header) return false;
        this.lon = this.radarNf.Header.Position[0]||window.radarPosition[0]||103.2922;
        this.lat = this.radarNf.Header.Position[1]||window.radarPosition[1]||29.94614;   //成都
        this.alt = this.radarNf.Header.Position[2]||window.radarPosition[2]||1000;
        this.station.Latitude=this.lat;
        this.station.Longitude=this.lon;
        this.station.Height=this.alt;

        this.removeEvent();
        this.destroy();

        let center = Cesium.Cartesian3.fromDegrees(this.lon, this.lat, this.alt);
        modelMatrix = Cesium.Transforms.eastNorthUpToFixedFrame(center);
        this.weatherRadarSpace = new MeshVisualizer({
            up: { z: 1 },
            modelMatrix: modelMatrix
        });
        this.viewer.scene.primitives.add(this.weatherRadarSpace);
        this.meshVisualizers.push(this.weatherRadarSpace);
        this.VCSImageViewer.available = true;
        this.updateVCSLayer();

        this.initMouseEventHandler();
        this.updateData(radarNf);
    };
    // 移出原有绑定事件
    A.prototype.removeEvent=function(){
        this.handler.removeInputAction(Cesium.ScreenSpaceEventType.MOUSE_MOVE);
        this.handler.removeInputAction(Cesium.ScreenSpaceEventType.LEFT_CLICK);
        this.handler.removeInputAction(Cesium.ScreenSpaceEventType.LEFT_DOUBLE_CLICK);
    };
    // 摧毁绑定事件
    A.prototype.destroy=function(){
        if(this.handler.isDestroy) this.handler.destroy();
        this.removeAllLayer();
    };
    // 摧毁所有图层
    A.prototype.removeAllLayer = function () {
        if (this.vectorLayer) {
            this.viewer.imageryLayers.remove(this.vectorLayer);
            this.vectorLayer = null;
        }
        if (this.radarBaseImageryLayer) {
            this.viewer.imageryLayers.remove(this.radarBaseImageryLayer);
            this.radarBaseImageryLayer = null;
        }
        if (this.radarGridLayer) {
            this.viewer.imageryLayers.remove(this.radarGridLayer);
            this.radarGridLayer = null;
        }
        if (this.RHIImageViewer && this.RHIImageViewer.available) {
            this.RHIImageViewer.hide();
        }
        if (this.VCSImageViewer && this.VCSImageViewer.available) {
            this.VCSImageViewer.hide();
        }
        if (this.legendOverlay) {
            this.legendOverlay.hide();
        }
        if(this.walls&&this.walls.length>0){
            this.walls.forEach(wall=>{
                this.viewer.entities.remove(wall);
            });
        }
    };

    /**
    *处理鼠标交互
    */
    A.prototype.initMouseEventHandler = function () {
        let _self = this;
        let handler = _self.handler;//new Cesium.ScreenSpaceEventHandler(this.viewer.scene.canvas);
        let startPick = false;
        let endPick = false;

        let startPoint = new Cesium.Cartesian3(0, 0, 0);
        let endPoint = new Cesium.Cartesian3(1, 1, 1);
        let pickedPoint = {};

        let vcsPoints = [new Cesium.Cartesian3(0, 0, 0), new Cesium.Cartesian3(1, 1, 1)];
        let defaultImage = document.createElement("canvas");
        let cvsSliceEntity;
        let transparent = false;
        (function () {
            let wall={
                name: '',
                polyline: {
                    positions: new Cesium.CallbackProperty(function () {
                        return vcsPoints;
                    }, false),
                    width: 2,
                    material: Cesium.Color.RED
                },
                wall: {
                    positions: new Cesium.CallbackProperty(function () {
                        return vcsPoints;
                    }, false),
                    material: new Cesium.ImageMaterialProperty({
                        image: new Cesium.CallbackProperty(function () {
                            if (_self.VCSImage) {
                                return _self.VCSImage;
                            } else {
                                return defaultImage
                            }
                        }, false),
                        // transparent: transparent
                    }),
                    fill: true,
                    outline: true,
                    outlineColor: Cesium.Color.RED,
                    minimumHeights: [0, 0],
                    maximumHeights: [20 * 1000, 20 * 1000]
                },
                show: false
            };
            cvsSliceEntity = _self.viewer.entities.add(wall);
            _self.walls.push(cvsSliceEntity);
        })();

        handler.setInputAction(function (movement) {
            if (!_self.VCSImageViewer.available) {
                return;
            }
            pickedPoint = _self.pickPoint(movement.position, pickedPoint);

            if (pickedPoint && pickedPoint.radarCoordinates) {
                if (_self.VCSImageViewer.available) {

                    _self.weatherRadarSpace.localToWorldCoordinates(vcsPoints[1], vcsPoints[1]);
                    if (!startPick) {
                        Cesium.Cartesian3.clone(pickedPoint.radarCoordinates, startPoint);
                        Cesium.Cartesian3.clone(pickedPoint.worldCoordinates, vcsPoints[0]);
                        cvsSliceEntity.show = false;
                        startPick = true;
                    } else {
                        Cesium.Cartesian3.clone(pickedPoint.radarCoordinates, endPoint);
                        Cesium.Cartesian3.clone(pickedPoint.worldCoordinates, vcsPoints[1]);
                        _self.updateVCSLayer(startPoint, endPoint);
                        cvsSliceEntity.show = _self.VCSImageViewer.available;
                        startPick = false;
                    }
                }
            }
        }, Cesium.ScreenSpaceEventType.LEFT_CLICK);

        handler.setInputAction(function (movement) {
            pickedPoint = _self.pickPoint(movement.endPosition, pickedPoint);

            if (pickedPoint && pickedPoint.radarCoordinates) {
                _self.pickWeatherRadar(pickedPoint);
                if (startPick) {
                    Cesium.Cartesian3.clone(pickedPoint.radarCoordinates, endPoint);
                    Cesium.Cartesian3.clone(pickedPoint.worldCoordinates, vcsPoints[1]);
                    _self.updateVCSLayer(startPoint, endPoint);
                    cvsSliceEntity.show = _self.VCSImageViewer.available;
                }
            }
        }, Cesium.ScreenSpaceEventType.MOUSE_MOVE);
    };
    /**
    *获取当前点击点的各类坐标
    */
    A.prototype.pickPoint = function (windowPosition, pickedPoint) {
        var viewer = this.viewer;
        var scene = viewer.scene;
        //if (!scene.pickPositionSupported || this.viewer.scene.mode == Cesium.SceneMode.SCENE2D) {
        intersection = viewer.camera.pickEllipsoid(windowPosition, scene.globe.ellipsoid);
        //} else { 
        //    scene.pickPosition(windowPosition, intersection);
        //}
        if (!intersection) {
            return undefined;
        }
        scene.globe.ellipsoid.cartesianToCartographic(intersection, intersectCartographic);
        if (!pickedPoint) {
            pickedPoint = {};
        }
        if (this.radarNf && this.weatherRadarSpace) {
            var weatherRadarSpace = this.weatherRadarSpace;
            weatherRadarSpace.worldCoordinatesToLocal(intersection, intersectionLocal);
            intersection.z+=1000;
            intersectionLocal.z+=1000;
            var azimuth = Cesium.Math.toDegrees(Math.atan2(intersectionLocal.x, intersectionLocal.y));
            if (azimuth < 0) {
                azimuth = 360 + azimuth;
            }
    
            var rXY = Math.sqrt(Math.pow(intersectionLocal.x, 2), Math.pow(intersectionLocal.y, 2));
            intersectionPolar.elevation = Cesium.Math.toDegrees(Math.atan2(rXY, intersectionLocal.z));
            intersectionPolar.azimuth = azimuth;
            intersectionPolar.radius = Math.sqrt(Math.pow(rXY, 2), Math.pow(intersectionLocal.z, 2))
            intersectionPolar.radiusXY = rXY;
            pickedPoint.worldCoordinates = intersection;
            pickedPoint.radarCoordinates = intersectionLocal;
            pickedPoint.lonlat = intersectCartographic;
            pickedPoint.polarCoordinates = intersectionPolar;
    
        } else {
            pickedPoint.worldCoordinates = undefined;
            pickedPoint.radarCoordinates = undefined;
            pickedPoint.lonlat = undefined;
            pickedPoint.polarCoordinates = undefined;
        }
    
        return pickedPoint;
    };
    /**
    *鼠标跟踪和点选功能
    */
    A.prototype.pickWeatherRadar = function (pickedPoint) {
        if (this.radarNf && this.weatherRadarSpace && pickedPoint.radarCoordinates) {
            if (this.currentRadarLayerIndex >= 9) {
                map.mapStateBar.appendText(" " + this.currentFileName);
                return;
            }
            var radarNf = this.radarNf;
            var elev = radarNf.Header.Elevations[this.currentRadarLayerIndex];
    
            var azimuth = pickedPoint.polarCoordinates.azimuth;
    
            var r = pickedPoint.polarCoordinates.radiusXY / Math.cos(Cesium.Math.toRadians(elev));
    
            var v = radarNf.get(
                0,
                parseInt(azimuth),
                parseInt(r / radarNf.Header.GateSizeOfReflectivity)
            );
            var unit = "dBZ";
            if (radarNf.Header.BandNo != 0) {
                unit = "";
            }
            if (v == -999.0) {
                unit = "";
                v = "无效值";
            }
            // map.mapStateBar.appendText(" " + this.currentFileName + " <span style='color:rgba(23,169,228,1);'>雷达点(" + elev.toFixed(2) + "°," + azimuth.toFixed(2) + "°," + (r / 1000.0).toFixed(2) + "km):" + v + " " + unit + "</span>");
        }
    };
    /**
    *
    *雷达局部坐标（笛卡尔）转地理坐标
    */
    A.prototype.radarCoordinatesToCartographic = function (radarCoordinates, cartographic) {
        if (!cartographic) {
            cartographic = new Cesium.Cartographic();
        }
    
        var cn = new MyLatLng(this.station.Longitude, this.station.Latitude);
        var length = Math.sqrt(Math.pow(radarCoordinates.x, 2) + Math.pow(radarCoordinates.y, 2));
        var angle = Cesium.Math.toDegrees(Math.atan2(radarCoordinates.x, radarCoordinates.y));
        var lonlat = CoordinateHelper.getMyLatLng(cn, length / 1000.0, angle);
        cartographic.longitude = Cesium.Math.toRadians(lonlat.m_Longitude);
        cartographic.latitude = Cesium.Math.toRadians(lonlat.m_Latitude);
        // cartographic.height = 0;
        cartographic.height = this.station.Height+this.alt;
        return cartographic;
    };
    /**
    *获取底部地理坐标范围
    */
    A.prototype.rectangleFromDimensions = function (dimensions, rectangle) {
        if (!rectangle) {
            rectangle = new Cesium.Rectangle()
        }
        var rX = dimensions.x / 2,
            rY = dimensions.y / 2;
        var sw = this.radarCoordinatesToCartographic(new Cesium.Cartesian3(-rX, -rY, 0));
        var ne = this.radarCoordinatesToCartographic(new Cesium.Cartesian3(rX, rY, 0));
        rectangle.west = sw.longitude;
        rectangle.south = sw.latitude;
        rectangle.east = ne.longitude;
        rectangle.north = ne.latitude;
    
        return rectangle;
    };
    /**
    *@param {Number}bandNo
    *@return {String} 
    */
    A.prototype.getBandName = function (bandNo) {
        switch (bandNo) {
            case 0: return "R";
            case 1: return "V";
            case 2: return "W";
            default: return "R";
        }
    };
    
    A.prototype.createRadarLayerGeometry = function (radarDataNf, layerIndex, rCount, angleCount) {
        if (!layerIndex) {
            layerIndex = 0;
        }

        var gates = radarDataNf.Header.Gates[radarDataNf.Header.BandNo];
        var gateSize = radarDataNf.Header.GateSizeOfReflectivity
        var positions = new Float32Array(gates * 361 * 3);
        var indices = [];
        var elv = radarDataNf.Header.Elevations[layerIndex];
        var index = 0;
        var indicesMatrix = [];
        if (!rCount) {
            rCount = gates;
        }
        if (!angleCount) {
            angleCount = 360;
        }
        var deltR = Math.floor(gates / rCount);
        var deltA = parseInt(360 / angleCount);
        for (var k = 0; k <= Math.ceil(deltR * rCount) ; k += deltR) {
            var rowIndicesMatrix = new Int32Array(361);
            for (var j = 0; j <= 360; j += 1) {
                //计算顶点坐标（局部，相对雷达站点位置，距离单位为米）
                var length = (gateSize * k); //径向距离  
                var radius = length * Math.cos(elv); //投影距离
                var height = length * Math.sin(elv);
                height+=(radarDataNf.Header.Position[2]*(1+Math.sin(elv))+800*(1+Math.sin(elv)));   

                var x = radius * Math.cos(Cesium.Math.toRadians(j)),
                    y = radius * Math.sin(Cesium.Math.toRadians(j)),
                    z = height;

                positions[index * 3] = x;
                positions[index * 3 + 1] = y;
                positions[index * 3 + 2] = z;
                rowIndicesMatrix[j] = index++;
            }
            indicesMatrix.push(rowIndicesMatrix);
        }

        for (var i = 1; i < indicesMatrix.length; i++) {
            for (var j = 1; j < indicesMatrix[i].length; j++) {
                i0 = indicesMatrix[i - 1][j - 1],
                    i1 = indicesMatrix[i][j - 1],
                    i2 = indicesMatrix[i][j],
                    i3 = indicesMatrix[i - 1][j];

                indices.push(i0);
                indices.push(i3);

                indices.push(i1);
                indices.push(i2);

                if (j % deltA == 0) {
                    indices.push(i2);
                    indices.push(i3);
                }
                if (j == indicesMatrix[i].length - 1) {//首尾相连
                    i0 = indicesMatrix[i - 1][j],
                        i1 = indicesMatrix[i][j],

                        i2 = indicesMatrix[i][0],
                        i3 = indicesMatrix[i - 1][0];

                    indices.push(i0);
                    indices.push(i3);

                    indices.push(i1);
                    indices.push(i2);
                }
            }
        }

        var attributes = {
            position: new Cesium.GeometryAttribute({
                componentDatatype: Cesium.ComponentDatatype.DOUBLE,
                componentsPerAttribute: 3,
                values: positions
            })
        };
        indices = new Int32Array(indices);
        var bs = Cesium.BoundingSphere.fromVertices(positions);
        var geo = new Cesium.Geometry({
            attributes: attributes,
            indices: indices,
            primitiveType: Cesium.PrimitiveType.LINES,//TRIANGLES,
            boundingSphere: bs
        });
        return geo;
    };
    A.prototype.cesiumGeometryToGeojson = function (geometry, proerties) {

        var indices = geometry.indices;

        var points = [];
        var p = new Cesium.Cartesian3();
        var lonlat = new Cesium.Cartographic();

        var triangles = [];
        var lines = [];
        var turf = MeteoLib.Util.turf;
        for (var i = 0; i < indices.length; i++) {
            var idx = indices[i] * 3;
            Cesium.Cartesian3.fromArray(geometry.attributes.position.values, idx, p)
            this.radarCoordinatesToCartographic(p, lonlat);
            points.push([
                Cesium.Math.toDegrees(lonlat.longitude),
                Cesium.Math.toDegrees(lonlat.latitude)
            ])
            if (geometry.primitiveType == Cesium.PrimitiveType.TRIANGLES
                && points.length == 3) {

                triangles.push(points);
                points = [];
            } else if (points.length == 2) {
                lines.push(points);
                points = [];
            }
        }
        if (geometry.primitiveType == Cesium.PrimitiveType.LINES) {
            return turf.featureCollection([turf.multiLineString(lines, proerties)]);
        } else {
            return turf.featureCollection([turf.polygon(triangles, proerties)]);
        }
    };
    /**
     * 
     * @param {Object} options
     * @param {Object} options.x
     * @param {Number} options.x.count
     * @param {Number} options.x.distance
     * @param {Number} [options.x.label]
     * @param {Object} options.y
     * @param {Number} options.y.count
     * @param {Number} options.y.distance
     * @param {Number} [options.y.label]
     * @param {Object} [options.offset]
     * @param {Array.<HTMLCanvasElement|HTMLImageElement|HTMLVideoElement>|Array.<Object>} [options.baseLayers]
     * @param {Number} [options.offset.left=40]
     * @param {Number} [options.offset.top=40]
     * @param {Number} [options.offset.bottom=30]
     * @param {Number} [options.offset.right=50]
     * @param {String} [options.title='']
     * @param {Object} [options.clientSize]
     * @param {Number} [options.clientSize.width=512]
     * @param {Number} [options.clientSize.height=256]
     * @param {Number} [options.fontSize=16]
     * @param {String} [options.backColor='rgb(101,101,10)']
     * @param {HTMLCanvasElement} [options.target]
     */
    A.prototype.drawGrid = function (options) {
        var xOptions = options.x,
            yOptions = options.y,
            offset = options.offset,
            title = options.title,
            clientSize = options.clientSize,
            baseLayers = options.baseLayers,
            fontSize = options.fontSize,
            backColor = options.backColor,
            target = options.target;
        if (!fontSize) {
            fontSize = 12;
        }
        if (!baseLayers) {
            baseLayers = [];
        }
        if (!clientSize) {
            clientSize = { width: 512, height: 256 }
        }
        if (!backColor) {
            backColor = "rgb(255,255,255)";
        }
        if (!offset) offset = {};
        offset = Object.assign(offset, {
            // left: 40,
            // top: 40,
            // bottom: 30,
            // right: 50,
            left: 10,
            top: 20,
            bottom: 20,
            right: 10,
            width: function () {
                return this.left + this.right
            },
            height: function () {
                return this.top + this.bottom
            }
        });
    
        var newCv = target ? target : document.createElement("canvas");
        // newCv.width = clientSize.width + offset.width();
        // newCv.height = clientSize.height + offset.height();
        newCv.width = clientSize.width;
        newCv.height = clientSize.height;
        var ctx = newCv.getContext("2d");
    
        ctx.font = fontSize + "px arial";
        ctx.strokeStyle = "rgba(101,101,101,1)";
        ctx.fillStyle = "rgba(101,101,101,1)";
    
        if (yOptions.label) {
            offset.top += fontSize;
            offset.left += ctx.measureText(yOptions.label).width / 2;
        }
        if (xOptions.label) {
            offset.bottom += fontSize;
            offset.right += ctx.measureText(xOptions.label).width / 2;
        }
        // newCv.width = clientSize.width + offset.width();
        // newCv.height = clientSize.height + offset.height();
        newCv.width = clientSize.width;
        newCv.height = clientSize.height;
        ctx = newCv.getContext("2d");
    
        ctx.fillStyle = backColor;
        ctx.fillRect(0, 0, newCv.width, newCv.height);
    
        ctx.font = fontSize + "px Microsoft YaHei";
        ctx.strokeStyle = "rgba(101,101,101,1)";
        ctx.fillStyle = "rgba(101,101,101,1)";
    
        for (var i = 0; i < baseLayers.length; i++) {
            var layer = baseLayers[i];
            if (layer instanceof HTMLCanvasElement ||
                layer instanceof HTMLImageElement ||
                layer instanceof HTMLVideoElement) {
                layer = { image: layer };
            }
            if (!layer.image) {
                continue;
            }
            if (!layer.position) {
                layer.position = { x: 0, y: 0 };
            }
            if (!layer.size) {
                layer.size = { width: layer.image.width, height: layer.image.height };
            }
            // ctx.drawImage(layer.image, layer.position.x + offset.left, layer.position.y + offset.top, layer.size.width, layer.size.height);
            ctx.drawImage(layer.image, layer.position.x+offset.width(), layer.position.y - offset.bottom, layer.size.width - offset.width(), layer.size.height);
        }
    
        var deltX = (clientSize.width-offset.width()) / xOptions.count;
        var deltY = (clientSize.height-offset.height()) / yOptions.count;
        for (var i = 0; i < yOptions.count; i++) {
            for (var j = 0; j < xOptions.count; j++) {
                ctx.strokeRect(j * deltX + offset.width(), i * deltY + offset.top, deltX, deltY);
                // ctx.strokeRect(j * deltX + offset.left, i * deltY, deltX, deltY);
            }
        }
    
        var deltDisY = (yOptions.distance) / yOptions.count;
        var deltDisX = (xOptions.distance) / xOptions.count;
    
    
        var i;
        var txtLen, txt, posX, poxY;
        for (i = 0; i <= yOptions.count; i++) {
            txt = ((yOptions.count - i) * deltDisY).toFixed(1);
            txtLen = ctx.measureText(txt).width;
            posX = offset.width() - txtLen - 5;
            poxY = i * deltY + fontSize / 3 + offset.top;
            ctx.fillText(txt, posX, poxY)
        }
        if (yOptions.label) {
            poxY = offset.top - fontSize;
            txt = yOptions.label;
            txtLen = ctx.measureText(txt).width;
            posX = offset.width() - txtLen - 5;
            ctx.fillText(txt, posX, poxY)
        }
    
        for (i = 0; i <= xOptions.count; i++) {
            txt = (i * deltDisX).toFixed(1);
            txtLen = ctx.measureText(txt).width;
            posX = i * deltX + offset.width() - txtLen / 2;
            posY = clientSize.height + fontSize + 5 + offset.top;
            ctx.fillText(txt, posX, posY)
        }
        if (xOptions.label) {
            posX = posX + txtLen+offset.width();
            txt = xOptions.label;
            txtLen = ctx.measureText(txt).width;
            posY = clientSize.height + fontSize + 5 + offset.top;
            ctx.fillText(txt, posX, posY)
        }
    
        fontSize = 14;
        ctx.font = fontSize + "px FangSong";
    
        if (title) {
            var txtLen = ctx.measureText(title).width;
            ctx.strokeText(title, (newCv.width - txtLen) / 2, offset.top - fontSize - 5)
        }
        return newCv;
    
    };
    
    //更新雷达仰角
    A.prototype.updateRadarLayerIndex = function(idx){
        if(!this.radarNf) return false;
        if(!idx||typeof idx!=="number") idx=0;
        this.currentRadarLayerIndex=idx;
        this.updateData(this.radarNf);
    };
    //更新雷达扫描数据
    A.prototype.updateData = function (radarNf) {
        let _self = this;
        if(!_self.radarNf) return false;
        if(!radarNf) radarNf=_self.radarNf;
        _self.MaxLayerNum=radarNf.Header.ElevationCount;
        radarNf._computeProjectionParams();
        var pixels = new Uint8Array(radarNf.EncodedData.length * 4);
        for (var i = 0; i < radarNf.EncodedData.length; i++) {
            pixels[i * 4] = radarNf.EncodedData[i];
            pixels[i * 4 + 1] = radarNf.EncodedData[i];
            pixels[i * 4 + 2] = radarNf.EncodedData[i];
            pixels[i * 4 + 3] = radarNf.EncodedData[i] >= 1 ? 255 : 0;
        }
        var width = radarNf.Header.Gates[radarNf.Header.BandNo],
            height = radarNf.Header.ElevationCount * 361;

        radarNf.Pixels = pixels;
        radarNf.TextureUrl = ImageUtil.fromPixels(pixels, width, height).toDataURL();
        // if (_self.radarNf) {
        //     _self.radarNf.destroy();
        // }
        _self.radarNf={};
        _self.radarNf=radarNf;
        _self.ready = true;
        _self.update();

    };
    /**
    *通过数据更新绘图
    */
    A.prototype.update = function () {
        var _self = this;

        if (this.radarNf && this.ready) {
            var radarNf = this.radarNf
            var d = radarNf.ProjParams.d;
            var r = d / 2.0;
            var h = radarNf.ProjParams.h;
            var gates = radarNf.Header.Gates[radarNf.Header.BandNo];
            var gateSize = radarNf.Header.GateSizeOfReflectivity;
            var deltR = Math.floor(gates / 9.0);
            var rView = Math.cos(radarNf.Header.Elevations[0]) * deltR * 8 * gateSize * 2;
            var hView = 20 * 1000;

            var dimensions = new Cesium.Cartesian3(d, d, h);
            var viewDimensions = new Cesium.Cartesian3(rView, rView, hView);//500 * 1000, 500 * 1000, 20 * 1000)
            this.rectangle = this.rectangleFromDimensions(dimensions, this.rectangle);
            this.viewRectangle = this.rectangleFromDimensions(viewDimensions, this.viewRectangle);
            this.viewDimensions = viewDimensions;
            this.dimensions = dimensions;

            if (!this.sliceFramebuffer) {
                var materialInterp = new RadarMaterial({
                    colorMap: _self.colorMap,
                    data: radarNf,
                    dimensions: dimensions,
                    type: RadarMaterial.Types.Slice,
                    uniforms: {
                        granularity: 0.1,
                        min: _self.colorMap[_self.colorMap.length - 1][1],
                        max: _self.colorMap[0][0],
                        sliceCoord: -999,
                        mode: RadarMaterial.SliceMode.Z,
                        encode: 0,
                        startPoint: new Cesium.Cartesian3(),//仅在任意垂直剖面有用
                        endPoint: new Cesium.Cartesian3(),//仅在任意垂直剖面有用
                        useLinearInterp: true,
                        viewDimensions: viewDimensions
                    },
                    //fragmentShader: interp_frag,
                    //vertexShader: interp_vert
                });


                var geometry = new PlaneBufferGeometry(3, 3);
                var meshInterp = new Mesh(geometry, materialInterp);
                var fb = new FramebufferTexture(meshInterp);
                this.sliceFramebuffer = fb;
                this.sliceMaterial = materialInterp;
                this.radarMaterials.push(materialInterp);

            }
            //绘制地面圆盘网格
            if (!_self.radarGridLayer) {
                var geometry = this.createRadarLayerGeometry(_self.radarNf, _self.currentRadarLayerIndex, _self.radarNf.Header.ElevationCount, 12);

                var radarGridGeojson = this.cesiumGeometryToGeojson(geometry);
                _self.radarGridLayer = this.viewer.imageryLayers.addImageryProvider(
                    new MeteoLib.Scene.VectorTileImageryProvider({
                        source: radarGridGeojson,
                        defaultStyle: {
                            outlineColor: "rgb(255,255,255)",//"rgba(23,169,228,1)",
                            lineWidth: 1.2,
                            fill: false,
                            fillColor: "rgba(16,71,97,0.7)"
                        }
                    })
                );

            }
            //绘制色卡
            if (!_self.legendOverlay) {
                _self.legendOverlay = new MeteoLib.Widgets.ScreenOverlay(this.viewer);
                var legendSize, recMargins, legendPadding, fontSize = 15;
                var lg = MeteoLib.Render.GridDataColorMap.getLegendEx(_self.colorMap,
                    " dBZ  ",
                    { width: 20, height: 40 }, legendSize, recMargins, legendPadding, fontSize).imageUrl
                _self.legendOverlay.showSingleImage(lg);
            } else {
                this.legendOverlay.show();
            }
            // _self.legendOverlay.container.style = "position:absolute;right:10px;bottom:30px;";

            function imageLoaded(img) {
                _self.radarNf.TextureUrl = img;
                for (var i = 0; i < _self.radarMaterials.length; i++) {
                    _self.radarMaterials[i].data = _self.radarNf;
                    _self.radarMaterials[i].uniforms.dimensions.value.x = d;
                    _self.radarMaterials[i].uniforms.dimensions.value.y = d;
                    _self.radarMaterials[i].uniforms.dimensions.value.z = h;
                    _self.radarMaterials[i].uniforms.viewDimensions.value.x = rView;// 500 * 1000;
                    _self.radarMaterials[i].uniforms.viewDimensions.value.y = rView;// 500 * 1000;
                    _self.radarMaterials[i].uniforms.viewDimensions.value.z = hView;//20 * 1000;
                    _self.radarMaterials[i].uniforms.min.value = _self.colorMap[_self.colorMap.length - 1][1];
                    _self.radarMaterials[i].uniforms.max.value = _self.colorMap[0][0];
                }
                _self.updateBaseRadarLayer();
                // _self.updateRHILayer();
                _self.updateVCSLayer();
            }
            if(!this.radarNf.TextureUrl) return false;
            // imageLoaded(this.radarNf.TextureUrl);
            Cesium.loadImage(this.radarNf.TextureUrl).then(imageLoaded)
            // _self.updateBaseRadarLayer();
            // _self.updateVCSLayer();
            // if (typeof this.radarNf.TextureUrl === 'string') {
            //     Cesium.loadImage(this.radarNf.TextureUrl).then(imageLoaded);
            // }
            // else {
            //     imageLoaded(this.radarNf.TextureUrl);
            // }
        }
    };
    /**
    *更新雷达底图图层
    */
    A.prototype.updateBaseRadarLayer = function () {
        var _self = this;
        if (this.currentRadarLayerIndex < this.MaxLayerNum) {
            this.sliceMaterial.uniforms.sliceCoord.value = this.radarNf.Header.Elevations[this.currentRadarLayerIndex];
            this.sliceMaterial.uniforms.mode.value = RadarMaterial.SliceMode.L;
        } else if (this.currentRadarLayerIndex == 0) {
            this.sliceMaterial.uniforms.sliceCoord.value = this.cappiHeight * 1000;
            this.sliceMaterial.uniforms.mode.value = RadarMaterial.SliceMode.Z;
        } else if (this.currentRadarLayerIndex == this.MaxLayerNum) {
            this.sliceMaterial.uniforms.mode.value = 7;//RadarMaterial.SliceMode.L;
        }
    
        this.cappiViewport.height = this.cappiViewport.width * this.rectangle.height / this.rectangle.width;
        if (scratchPixels && scratchPixels.length != this.cappiViewport.width * this.cappiViewport.height * 4) {
            scratchPixels = undefined;
        }
        scratchPixels = this.weatherRadarSpace.getPixels(this.viewer.scene.frameState, this.sliceFramebuffer, this.cappiViewport, scratchPixels);
        var cv = ImageUtil.fromPixels(scratchPixels, this.cappiViewport.width, this.cappiViewport.height);
    
        var newLayer = _self.viewer.imageryLayers.addImageryProvider(
            new Cesium.SingleTileImageryProvider({
                // rectangle: _self.rectangle,
                rectangle:new Cesium.Rectangle(_self.rectangle.west, _self.rectangle.south, _self.rectangle.east, _self.rectangle.north),
                url: cv
            }), 3
        );
        newLayer.imageryProvider.readyPromise.then(function () {
            setTimeout(function () {
                if (_self.radarBaseImageryLayer) {
                    _self.viewer.imageryLayers.remove(_self.radarBaseImageryLayer);
                }
                _self.radarBaseImageryLayer = newLayer;
            }, 80)
        })
    
    
    };
    /**
    *更新VCS垂直面
    */
    A.prototype.updateVCSLayer = function (startPoint, endPoint) {
        let _self = this;
        if (!this.VCSImageViewer.available || !this.ready || !this.radarNf) {
            return;
        }
        if (!endPoint && !startPoint && !this.VCSImage) {
            this.VCSImageViewer.show();
            if(this.VCSImageViewer.css('left')=="0px"&&this.VCSImageViewer.css('top')=="0px") this.VCSImageViewer.css({"left":($(window).width()-this.VCSImageViewer.width()-50)+"px","top":"50px"});
            return;
        }
    
        // this.verticalViewport.width = this.VCSImageViewer.size.width
        // this.verticalViewport.height = this.VCSImageViewer.size.height;
    
        var r = 414 * 1000;
        var d = 2 * r;
        var h = 20 * 1000;
    
        this.sliceMaterial.uniforms.mode.value = RadarMaterial.SliceMode.VCS;
        if (startPoint) {
            Cesium.Cartesian3.clone(startPoint, this.sliceMaterial.uniforms.startPoint.value);
        }
        else {
            startPoint = this.sliceMaterial.uniforms.startPoint.value
        }
        if (endPoint) {
            Cesium.Cartesian3.clone(endPoint, this.sliceMaterial.uniforms.endPoint.value);
        } else {
            endPoint = this.sliceMaterial.uniforms.endPoint.value
        }
    
    
        if (scratchVerticalPixels && scratchVerticalPixels.length != this.verticalViewport.width * this.verticalViewport.height * 4) {
            scratchVerticalPixels = undefined;
        }
    
        scratchVerticalPixels = this.weatherRadarSpace.getPixels(this.viewer.scene.frameState, this.sliceFramebuffer, this.verticalViewport, scratchVerticalPixels);
    
        var cv = ImageUtil.fromPixels(scratchVerticalPixels, this.verticalViewport.width, this.verticalViewport.height);
    
        var startAngle = Cesium.Math.toDegrees(Math.atan2(startPoint.x, startPoint.y));
        var startRadius = Math.sqrt(Math.pow(startPoint.x, 2) + Math.pow(startPoint.y, 2));
        if (startAngle < 0) {
            startAngle += 360;
        }
        var endAngle = Cesium.Math.toDegrees(Math.atan2(endPoint.x, endPoint.y));
        var endRadius = Math.sqrt(Math.pow(endPoint.x, 2) + Math.pow(endPoint.y, 2));
        if (endAngle < 0) {
            endAngle += 360;
        }
        var cvWidthGrid = this.drawGrid({
            target:_self.parentDoc.querySelector('#cutDiv canvas#scCanvas'),
            baseLayers: [cv],
            x: {
                count: 10,
                distance: Cesium.Cartesian3.distance(startPoint, endPoint) / 1500.0,
                label: "km"
            },
            y: {
                count: 5,
                distance: 10,
                label: "km"
            },
            // title: "起始点[" + startAngle.toFixed(1) + "°," + startRadius.toFixed(1) + "km]  " + "结束点[" + endAngle.toFixed(1) + "°," + endRadius.toFixed(1) + "km]  ",
            title: "起始点[" + startAngle.toFixed(1) + "°]  " + "结束点[" + endAngle.toFixed(1) + "°]  ",
            clientSize: {
                width: cv.width,
                height: cv.height
            }
        })
        this.VCSImageViewer.show();
        if(this.VCSImageViewer.css('left')=="0px"&&this.VCSImageViewer.css('top')=="0px") this.VCSImageViewer.css({"left":($(window).width()-this.VCSImageViewer.width()-50)+"px","top":"50px"});
    
        this.VCSImage = cv;
    };

    /**
    *导出当前产品
    */
    A.prototype.exportBaseLayer = function (exportImg, preview) {
        if (!this.ready || !this.radarNf) {
            MessageBox.show("提示", "数据未加载");
            return;
        }
        var _self = this;
        var bandName = this.getBandName(this.currentBandNo);
        var csvFName = this.actualFileListData[this.currentFileIndex].time.format("yyyyMMddhhmm") + "_" + bandName + "_{product}.csv";
        if (this.currentRadarLayerIndex < 9) {
            this.sliceMaterial.uniforms.sliceCoord.value = this.radarNf.Header.Elevations[this.currentRadarLayerIndex];
            this.sliceMaterial.uniforms.mode.value = RadarMaterial.SliceMode.L;
            csvFName = csvFName.replace("{product}", "PPI_L" + this.currentRadarLayerIndex + 1);
        } else if (this.currentRadarLayerIndex == 10) {
            this.sliceMaterial.uniforms.sliceCoord.value = this.cappiHeight * 1000;
            this.sliceMaterial.uniforms.mode.value = RadarMaterial.SliceMode.Z;
            csvFName = csvFName.replace("{product}", "CAPPI_" + this.cappiHeight + "km");
        } else if (this.currentRadarLayerIndex == 9) {
            this.sliceMaterial.uniforms.mode.value = 7;
            csvFName = csvFName.replace("{product}", "CR");
        }
        if (exportImg) {
            csvFName = csvFName.replace(".csv", ".png");
            var cv = this.viewer.scene.canvas;
            window.downloader.downloadFromDataURL(cv.toDataURL(), csvFName);
            return;
        }
    
        this.cappiViewport.height = this.cappiViewport.width * this.rectangle.height / this.rectangle.width
        if (scratchPixels && scratchPixels.length != this.cappiViewport.width * this.cappiViewport.height * 4) {
            scratchPixels = undefined;
        }
        var restoreEndoceV = this.sliceMaterial.uniforms.encode.value;//保存导出前的编解码标记
        this.sliceMaterial.uniforms.encode.value = exportImg ? 0 : 1;
        scratchPixels = this.weatherRadarSpace.getPixels(this.viewer.scene.frameState, this.sliceFramebuffer, this.cappiViewport, scratchPixels);
        this.sliceMaterial.uniforms.encode.value = restoreEndoceV;
    
        var a = 0;
        var csv = [preview ? ["A(角度)", "R(km)", "V(dBZ)"] : ["A(角度)", "R(km)", "V(dBZ)"].join(",")];
        var index = 0;
        var tempRow = [];
        var cnx = (this.cappiViewport.width - 1.0) / 2.0;
        var cny = (this.cappiViewport.height - 1.0) / 2.0;
        var resX = (this.viewDimensions.x / 1000.0) / (this.cappiViewport.width - 1.0);
        var resY = (this.viewDimensions.y / 1000.0) / (this.cappiViewport.height - 1.0);
    
        for (var i = 0; i < this.cappiViewport.height; i++) {
            for (var j = 0; j < this.cappiViewport.width; j++) {
                if (preview) {
                    tempRow = [];
                }
                var x = j - cnx, y = (this.cappiViewport.height - 1 - i - cny);
                a = Cesium.Math.toDegrees(Math.atan2(x, y));
                if (a < 0) {
                    a += 360;
                }
                tempRow[0] = a.toFixed(1);
                tempRow[1] = Math.sqrt(Math.pow(resY * y, 2) + Math.pow(resX * x, 2)).toFixed(1);
                if (scratchPixels[index] > 0) {
                    tempRow[2] = this.radarNf.decodeSingle(scratchPixels[index]).toFixed(1);
                } else {
                    if (_self.ingoreInvalidValue) {
                        index += 4;
                        continue;
                    }
    
                    tempRow[2] = "N/A";
                }
                csv.push(preview ? tempRow : tempRow.join(","))
                index += 4;
            }
        }
        if (preview) {
            this.dataViewer.showDataTable(csv, "radar2d-datagrid", csvFName);
            return;
        }
        csv = csv.join("\n");
        window.downloader.downloadText(csv, csvFName);
    };
    /**
    *到处VCS产品
    */
    A.prototype.exportVCS = function (startPoint, endPoint, exportImg, preview) {
        if (!this.ready || !this.radarNf) {
            MessageBox.show("提示", "数据未加载");
            return;
        }
        if (!endPoint && !startPoint && !this.VCSImage) {
            MessageBox.show("提示", "请先进行剖切操作");
            return;
        }

        // this.verticalViewport.width = this.VCSImageViewer.size.width
        // this.verticalViewport.height = this.VCSImageViewer.size.height;

        this.sliceMaterial.uniforms.mode.value = RadarMaterial.SliceMode.VCS;
        if (startPoint) {
            Cesium.Cartesian3.clone(startPoint, this.sliceMaterial.uniforms.startPoint.value);
        }
        else {
            startPoint = this.sliceMaterial.uniforms.startPoint.value
        }
        if (endPoint) {
            Cesium.Cartesian3.clone(endPoint, this.sliceMaterial.uniforms.endPoint.value);
        } else {
            endPoint = this.sliceMaterial.uniforms.endPoint.value
        }

        if (scratchVerticalPixels && scratchVerticalPixels.length != this.verticalViewport.width * this.verticalViewport.height * 4) {
            scratchVerticalPixels = undefined;
        }
        var restoreEndoceV = this.sliceMaterial.uniforms.encode.value;//保存导出前的编解码标记
        this.sliceMaterial.uniforms.encode.value = exportImg ? 0 : 1;
        scratchVerticalPixels = this.weatherRadarSpace.getPixels(this.viewer.scene.frameState, this.sliceFramebuffer, this.verticalViewport, scratchVerticalPixels);
        this.sliceMaterial.uniforms.encode.value = restoreEndoceV;

        var startAngle = Cesium.Math.toDegrees(Math.atan2(startPoint.x, startPoint.y));
        var startRadius = Math.sqrt(Math.pow(startPoint.x, 2) + Math.pow(startPoint.y, 2));
        if (startAngle < 0) {
            startAngle += 360;
        }
        var endAngle = Cesium.Math.toDegrees(Math.atan2(endPoint.x, endPoint.y));
        var endRadius = Math.sqrt(Math.pow(endPoint.x, 2) + Math.pow(endPoint.y, 2));
        if (endAngle < 0) {
            endAngle += 360;
        }
        var bandName = this.getBandName(this.currentBandNo);
        var csvFName = this.actualFileListData[this.currentFileIndex].time.format("yyyyMMddhhmm")
                    + "_" + bandName + "_VCS_" + startAngle.toFixed(1) + "_" + startRadius.toFixed(1) + "-"
            + endAngle.toFixed(1) + "_" + endRadius.toFixed(1);
        if (exportImg) {
            csvFName += ".png";
            var cv = ImageUtil.fromPixels(scratchVerticalPixels, this.verticalViewport.width, this.verticalViewport.height);
            var cvWidthGrid = this.drawGrid({
                baseLayers: [cv],
                x: {
                    count: 10,
                    distance: Cesium.Cartesian3.distance(startPoint, endPoint) / 1000.0,
                    label: "km"
                },
                y: {
                    count: 5,
                    distance: 20,
                    label: "km"
                },
                title: "起始点[" + startAngle.toFixed(1) + "°," + startRadius.toFixed(1) + "km]  " + "结束点[" + endAngle.toFixed(1) + "°," + endRadius.toFixed(1) + "km]  ",
                clientSize: {
                    width: cv.width,
                    height: cv.height
                }
            })
            window.downloader.downloadFromDataURL(cvWidthGrid.toDataURL(), csvFName);
            return;
        }
        csvFName += ".csv";

        var xDistance = Cesium.Cartesian3.distance(startPoint, endPoint) / 1000.0;
        var yDistance = 20;
        var resX = xDistance / this.verticalViewport.width;
        var resY = yDistance / this.verticalViewport.height;
        var index = 0;
        var csv = [preview ? ["X(km)", "Y(km)", "V(dBZ)"] : ["X(km)", "Y(km)", "V(dBZ)"].join(",")];
        var tempRow = [];
        for (var i = 0; i < this.verticalViewport.height; i++) {
            for (var j = 0; j < this.verticalViewport.width; j++) {
                if (preview) {
                    tempRow = [];
                }
                tempRow[0] = (resX * j).toFixed(1);
                tempRow[1] = (resY * i).toFixed(1);
                if (scratchVerticalPixels[index] > 0) {
                    tempRow[2] = this.radarNf.decodeSingle(scratchVerticalPixels[index]).toFixed(1);
                } else {
                    if (_self.ingoreInvalidValue) {
                        index += 4;
                        continue;
                    }
                    tempRow[2] = "N/A";
                }
                csv.push(preview ? tempRow : tempRow.join(","))
                index += 4;
            }
        }
        if (preview) {
            this.dataViewer.showDataTable(csv, "radar2d-datagrid", csvFName);
            return;
        }
        csv = csv.join("\n");
        window.downloader.downloadText(csv, csvFName);
    };

    return A;
})();

bulletCesium={
  Measure,
  Splice,
};
window['bulletCesium']=bulletCesium;