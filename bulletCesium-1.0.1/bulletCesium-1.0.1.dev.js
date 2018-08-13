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

bulletCesium={
  Measure,
};
window['bulletCesium']=bulletCesium;