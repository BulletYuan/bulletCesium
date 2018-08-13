# bulletCesium

> created at 2018.8.13
基于Cesiumjs的一些工具类，持续更新。

####

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

