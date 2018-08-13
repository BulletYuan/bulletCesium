# bulletCesium

> created at 2018.8.13
基于Cesiumjs的一些工具类，持续更新。

******

## lastest - 2018.8.13 - bulletCesium-1.0.1

 > 使用:
   
   ```
   let handler = new Cesium.ScreenSpaceEventHandler(viewer.scene.canvas);
   let measure = bulletCesium.Measure({ handler, });
   measure.measureDistance();   //测量距离
   measure.measureSquare();     //测量面积
   ```

 > 说明:

    ```
    /**
    * 测量类
    * @param {handler:Cesium.ScreenSpaceEventHandler,type:Number}
    * @description handler：获取屏幕事件句柄(必需)。type：0为测量距离(默认)，返回单位为米；1为测量面积，返回单位为平方米。
    *  
    */
    bulletCesium.Measure({
      handler,
      type,
    })
    ```

  > 参考:

  *   [多个点所围面积计算] (https://www.mathopenref.com/coordpolygonarea.html "Area of a polygon (Coordinate Geometry)")
  
  *   [获取鼠标点击位置信息] (https://blog.csdn.net/qq_40288344/article/details/79012572 "Cesium 获取鼠标当前位置的模型高度，地形高度，OSGB高度，及其经纬度。")
  
  *   [在地形上绘制] (https://www.wangdunwen.com/archives/34/ "在高程/地形上标绘")
  
  *   [绘制polyline对象] (https://blog.csdn.net/bretgui88/article/details/79076354 "Cesium在线绘制PolyLine折线")
  
  *   [绘制贴地线] (http://cesium.xin/wordpress/archives/178 "cesium编程中级(五)贴地线")
  
  *   [功能总览] (https://zhuanlan.zhihu.com/p/37236165 "cesium之地图贴地量算工具效果篇")

