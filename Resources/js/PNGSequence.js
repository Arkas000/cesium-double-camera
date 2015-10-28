function Movie( canvas, frameRate ){
    this.canvas = canvas;
    this.sequence = [];
    this.context = this.canvas.getContext("webgl");
    this.frameRate = frameRate;
    this.video = new Whammy.Video(frameRate);
};

Movie.prototype.addFrame = function() {
    this.sequence.push( this.canvas.toDataURL("image/webp") );
    //this.video.add(this.context);
}

/*Movie.prototype.autoCapture = function( fps ){
    var cap = this;
    this.sequence.length=0;
    this.timer = setInterval(function(){
        cap.addFrame();
    },1000/fps);
}*/

Movie.prototype.stop = function(){
    //if (this.timer) clearInterval(this.timer);
    //delete this.timer;
    //var output = this.video.compile();
    var output = Whammy.fromImageArray(this.sequence, this.frameRate);
    var url = URL.createObjectURL(output);
    //console.log(url);
    //document.getElementById('download').href = url;

    var a = document.createElement("a");
    document.body.appendChild(a);
    a.style.display = "none";
    a.href = url;
    a.download = "video-output.webm";
    a.click();
    window.URL.revokeObjectURL(url);

    return url;
};