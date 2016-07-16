export AABB from './lib/AABB'
export Bitmask from './lib/Bitmask'
export Body from './lib/Body'
export ClosedShape from './lib/ClosedShape'
export CollisionInfo from './lib/CollisionInfo'
export MaterialPair from './lib/MaterialPair'
export PointMass from './lib/PointMass'
export Spring from './lib/Spring'
export SpringBody from './lib/SpringBody'
export Utils from './lib/Utils'
export World from './lib/World'
export Vec2 from 'gl-matrix/src/gl-matrix/vec2'



setTimeout(function() {
    window.world = initScene();

    new Vue({
        el: '#app',
        data: function () {
            var width  = window.outerWidth;
            var height = window.outerHeight;

            return {
                width  : height,
                height : height,
                aspect : width / height,
                time   : 0,
            }
        },
        methods: {
            getBodyList: function() {
                return window.world.bodyList;
            },
            polygonFromGlobalShape: function(globalShape) {
                return '';
                var poly = '';
                for (var i = 0; i < globalShape.length; i++) {
                    var v = globalShape[i];
                    poly += ((v[0] / window.world.width) * this.width) + ',' + (this.height - (v[1] / window.world.height)*this.height) + ' ';
                }
                return poly;
            },
            polygonFromPmList: function(pointMassList) {
                var poly = '';
                for (var i = 0; i < pointMassList.length; i++) {
                    var v = pointMassList[i].position;
                    poly += ((v[0] / window.world.width) * this.width) + ',' + (this.height - (v[1] / window.world.height)*this.height) + ' ';
                }
                return poly;
            },
            polygonFromAABB: function(aabb) {
                return '';
                var poly = [
                    ((aabb.min[0] / window.world.width) * this.width) + ',' + (this.height - (aabb.min[1] / window.world.height)*this.height) + ' ',
                    ((aabb.min[0] / window.world.width) * this.width) + ',' + (this.height - (aabb.max[1] / window.world.height)*this.height) + ' ',
                    ((aabb.max[0] / window.world.width) * this.width) + ',' + (this.height - (aabb.max[1] / window.world.height)*this.height) + ' ',
                    ((aabb.max[0] / window.world.width) * this.width) + ',' + (this.height - (aabb.min[1] / window.world.height)*this.height) + ' '
                ]
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
    fallingShape.addVertex(BubblePhysics.Vec2.fromValues(0, 0));
    fallingShape.addVertex(BubblePhysics.Vec2.fromValues(0, 1));
    fallingShape.addVertex(BubblePhysics.Vec2.fromValues(1, 1));
    fallingShape.addVertex(BubblePhysics.Vec2.fromValues(1, 0));
    fallingShape.finish();

    var ground = new BubblePhysics.Body(groundShape, Number.POSITIVE_INFINITY, BubblePhysics.Vec2.fromValues(5, 2), 1);
    ground.isStatic = false;
    world.addBody(ground);
    var ground2 = new BubblePhysics.Body(groundShape, Number.POSITIVE_INFINITY, BubblePhysics.Vec2.fromValues(5, 2), -1);
    ground2.isStatic = false;
    world.addBody(ground2);

    var len = 20;
    for (var i = 0; i < len; i++) {
        var springBody = new BubblePhysics.SpringBody(fallingShape, 1, 100, 2, 100, 2, BubblePhysics.Vec2.fromValues(5+Math.random(), i));
            springBody.addSpring(springBody.pointMassList[0], springBody.pointMassList[2], 100, 12);
            springBody.addSpring(springBody.pointMassList[1], springBody.pointMassList[3], 100, 12);
        world.addBody(springBody);
    }

    return world;
}
