setTimeout(function() {
    window.world = initScene();

    new Vue({
        el: '#app',
        data: function () {
            var width  = window.outerWidth;
            var height = window.outerHeight;

            return {
                width  : width,
                height : height,
                aspect : width / height,
                time   : 0,
            }
        },
        methods: {
            getBodyList: function() {
                return window.world.bodyList;
            },
            polygonFromPmList: function(body) {
                var poly = '';
                for (var i = 0; i < body.pointMassList.length; i++) {
                    var v = body.pointMassList[i].position;
                    poly += ((v[0] / window.world.width) * this.width) + ',' + ((v[1] / window.world.height)*this.height) + ' ';
                }
                return poly;
            }
        },
        created: function () {
            var self = this;

            window.addEventListener('resize', function(event){
                self.width  = window.outerWidth;
                self.height = window.outerHeight;
                self.aspect = self.width / self.height;
            });
        },
        ready: function () {
            var self = this;
            function render_loop() {
                requestAnimationFrame(render_loop);
                var delta = 1/60;
                window.world.update(delta)
                self.time += delta;
            }

            render_loop();
        }
    });
}, 1000);

function initScene() {
    var world = new BubblePhysics.World();

    var groundShape = new BubblePhysics.ClosedShape();
    groundShape.begin();
    groundShape.addVertex(BubblePhysics.Vec2.fromValues(0, 0));
    groundShape.addVertex(BubblePhysics.Vec2.fromValues(0, 1));
    groundShape.addVertex(BubblePhysics.Vec2.fromValues(20, 1));
    groundShape.addVertex(BubblePhysics.Vec2.fromValues(20, 0));
    groundShape.finish();

    var fallingShape = new BubblePhysics.ClosedShape();
    fallingShape.begin();
    fallingShape.addVertex(BubblePhysics.Vec2.fromValues(-1, 0));
    fallingShape.addVertex(BubblePhysics.Vec2.fromValues(0, 1));
    fallingShape.addVertex(BubblePhysics.Vec2.fromValues(1, 0));
    fallingShape.addVertex(BubblePhysics.Vec2.fromValues(0, -1));
    fallingShape.finish();

    var springBody1 = new BubblePhysics.SpringBody(fallingShape, 1, 150, 5, 300, 15, BubblePhysics.Vec2.fromValues(4, 5), 0.2);
        springBody1.addSpring(springBody1.pointMassList[0], springBody1.pointMassList[2], 400, 12);
        springBody1.addSpring(springBody1.pointMassList[1], springBody1.pointMassList[3], 400, 12);
    var springBody2 = new BubblePhysics.SpringBody(fallingShape, 1, 150, 5, 300, 15, BubblePhysics.Vec2.fromValues(4, 0), 0.2);
        springBody2.addSpring(springBody2.pointMassList[0], springBody2.pointMassList[2], 400, 12);
        springBody2.addSpring(springBody2.pointMassList[1], springBody2.pointMassList[3], 400, 12);

    var ground = new BubblePhysics.Body(groundShape, Number.POSITIVE_INFINITY, BubblePhysics.Vec2.fromValues(0, 10));
    ground.isStatic = false;

    world.addBody(ground);
    world.addBody(springBody1);
    world.addBody(springBody2);

    return world;
}
