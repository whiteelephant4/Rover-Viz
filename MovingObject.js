export class MovingObject {
    constructor(viewer, roverPoints, timeStepInSeconds) {
      this.viewer = viewer;
      this.roverPoints = roverPoints;
      this.timeStepInSeconds = timeStepInSeconds;
      this.timeStepInDays = 0.24;
      this.start = JulianDate.fromIso8601("2024-08-23T12:33:00Z");
      this.stop = JulianDate.addDays(
        this.start,
        this.roverPoints.features.length * this.timeStepInDays,
        new JulianDate()
      );
      this._confingTime();
      this.positionProperty = this._computeTimePositionAdjastment();
      
    }
  
    _confingTime = () => {
      this.viewer.clock.startTime = this.start.clone();
      this.viewer.clock.stopTime = this.stop.clone();
      this.viewer.clock.currentTime = this.start.clone();
      this.viewer.timeline.zoomTo(this.start, this.stop);
      this.viewer.clock.multiplier = 10800;
      this.viewer.clock.shouldAnimate = false;

      this.viewer.clock.onTick.addEventListener(()=>{
        const currentTime = this.viewer.clock.currentTime;
        if(JulianDate.greaterThanOrEquals(currentTime,this.stop)){
            this.viewer.timeline.zoomTo(this.start,this.stop);
            this.viewer.clock.currentTime=this.start.clone();
        }
        if(JulianDate.lessThan(currentTime,this.start)){
            this.viewer.timeline.zoomTo(this.start,this.stop);
            this.viewer.clock.currentTime=this.stop.clone();
        }
      })
    };

    TimeInterval = new TimeInterval()
  
    _computeTimePositionAdjastment = async () => {
        let time;
        const positionProperty = new SampledPositionProperty();
        this.roverPoints.features.forEach((feature, i) => {

            time = JulianDate.addSeconds(
                this.start,
                i*this.timeStepInSeconds,
                new JulianDate()
            )

            const lon = feature.geometry.coordinates[0];
            const lat = feature.geometry.coordinates[1];
            let alt = 0;

            const position = Cartesian3.fromDegrees(lon, lat, alt)
            positionProperty.addSample(time, position);

            this.viewer.entities.add({
                name: `Point ${i}`,
                description: `Location: (${lon}, ${lat})`,
                position: position,
                point: { pixelSize: 5, color: Color.RED}
            })
        });
  
      return positionProperty;
    };
  
    addMovableEntityToViewer = (uri) => {
      // Load the glTF model from ion.
      const roverEntity = this.viewer.entities.add({
        name:"Pragyan Rover",
        availability: new TimeIntervalCollection([
          new TimeInterval({ start: this.start, stop: this.stop }),
        ]),
        position: this.positionProperty,
        // Attach the 3D model instead of the green point.
        model: { uri: uri,
            minimumPixelSize: 128,
            scale: 8,
            maximumScale: 12
         },
        // Automatically compute the orientation from the position.
        orientation: new VelocityOrientationProperty(
          this.positionProperty
        ),
        
          path: new PathGraphics({ width: 3, material: Color.BLUE }),
        viewFrom: new Cartesian3(-30, -379, 191),
      });
  
      this.viewer.trackedEntity = roverEntity;
    };

    updateImagesBasedOnPosition = () =>{
        this.viewer.clock.onTick.addEventListener(() => {
            const currentTime = this.viewer.clock.currentTime;

            for( let i = 0; i < this.roverPoints.features.length; i++){
                const pointTime = JulianDate.addSeconds(
                    this.start,
                    i * this.timeStepInSeconds, 
                    new JulianDate()
                )
                if(JulianDate.lessThanOrEquals(currentTime, this.start)){
                    const img1 = document.getElementById("image1")
                    const img2 = document.getElementById("image2")

                    img1.src = this.roverPoints.features[0].images[0];
                    img2.src = this.roverPoints.features[0].images[1];
                    break;
                }else if(JulianDate.lessThanOrEquals(currentTime, pointTime)){
                    const img1 = document.getElementById("image1")
                    const img2 = document.getElementById("image2")

                    img1.src = this.roverPoints.features[i - 1].images[0];
                    img2.src = this.roverPoints.features[i - 1].images[1];
                    break;
                }
            }
        })
    }
  }