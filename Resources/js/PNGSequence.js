function PNGSequence( canvas ){
    this.canvas = canvas;
    this.sequence = [];
};
PNGSequence.prototype.capture = function( fps ){
    var cap = this;
    this.sequence.length=0;
    this.timer = setInterval(function(){
        cap.sequence.push( cap.canvas.toDataURL() );
    },1000/fps);
};
PNGSequence.prototype.stop = function(){
    if (this.timer) clearInterval(this.timer);
    delete this.timer;
    return this.sequence;
};