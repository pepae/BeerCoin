import { useEffect, useRef, useState } from 'react';

const BeerGlassPhysics = () => {
  const canvasRef = useRef(null);
  const beerGlassRef = useRef(null);
  const [particleCount, setParticleCount] = useState(0);
  const [gravityReversed, setGravityReversed] = useState(false);
  const [accelerometerSupported, setAccelerometerSupported] = useState(false);

  useEffect(() => {
    // Wait for LiquidFun to be available
    const initializePhysics = () => {
      if (typeof window.b2World !== 'undefined' && canvasRef.current) {
        beerGlassRef.current = new BeerGlassSimulation(canvasRef.current, {
          onParticleCountChange: setParticleCount,
          onAccelerometerChange: setAccelerometerSupported
        });
      } else {
        // Retry after a short delay
        setTimeout(initializePhysics, 100);
      }
    };

    initializePhysics();

    return () => {
      if (beerGlassRef.current) {
        beerGlassRef.current.destroy();
      }
    };
  }, []);

  const handlePourBeer = () => {
    if (beerGlassRef.current) {
      beerGlassRef.current.pourBeer();
    }
  };

  const handleAddFoam = () => {
    if (beerGlassRef.current) {
      beerGlassRef.current.addFoam();
    }
  };

  const handleResetGlass = () => {
    if (beerGlassRef.current) {
      beerGlassRef.current.resetGlass();
    }
  };

  const handleToggleGravity = () => {
    if (beerGlassRef.current) {
      beerGlassRef.current.toggleGravity();
      setGravityReversed(!gravityReversed);
    }
  };

  return (
    <div className="beer-container">
      <h2 className="text-2xl font-bold mb-4 text-center">🍺 Interactive Beer Glass</h2>
      
      <div className="flex flex-wrap justify-center gap-2 mb-4">
        <button 
          className="beer-button-secondary px-3 py-2 text-sm"
          onClick={handlePourBeer}
        >
          Pour Beer
        </button>
        <button 
          className="beer-button-secondary px-3 py-2 text-sm"
          onClick={handleAddFoam}
        >
          Add Foam
        </button>
        <button 
          className="beer-button-secondary px-3 py-2 text-sm"
          onClick={handleResetGlass}
        >
          Reset
        </button>
        <button 
          className="beer-button-secondary px-3 py-2 text-sm"
          onClick={handleToggleGravity}
        >
          {gravityReversed ? 'Normal Gravity' : 'Reverse Gravity'}
        </button>
      </div>

      <div className="flex justify-center mb-4">
        <canvas 
          ref={canvasRef}
          width={400}
          height={600}
          className="border-2 border-primary rounded-lg bg-gradient-to-b from-gray-800 to-gray-900 shadow-lg"
        />
      </div>

      <div className="beer-card">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-muted-foreground">Particles:</span>
            <span className="ml-2 font-medium">{particleCount}</span>
          </div>
          <div>
            <span className="text-muted-foreground">Accelerometer:</span>
            <span className="ml-2 font-medium">
              {accelerometerSupported ? '✓ Active' : '✗ Not Available'}
            </span>
          </div>
          <div>
            <span className="text-muted-foreground">Gravity:</span>
            <span className="ml-2 font-medium">
              {gravityReversed ? 'Reversed' : 'Normal'}
            </span>
          </div>
          <div>
            <span className="text-muted-foreground">Physics:</span>
            <span className="ml-2 font-medium">LiquidFun</span>
          </div>
        </div>
      </div>

      <div className="mt-4 p-3 bg-primary/10 text-primary rounded-lg text-sm">
        <p className="font-medium mb-1">🍺 How to use:</p>
        <ul className="text-xs space-y-1">
          <li>• Tilt your phone to move the beer around!</li>
          <li>• Tap "Pour Beer" to fill the glass with golden beer</li>
          <li>• Add white foam that floats on top</li>
          <li>• Reset to empty the glass</li>
          <li>• On desktop: Move mouse over canvas to simulate tilt</li>
        </ul>
      </div>
    </div>
  );
};

// BeerGlassSimulation class (same logic as the HTML version)
class BeerGlassSimulation {
  constructor(canvas, callbacks = {}) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.callbacks = callbacks;
    
    // Physics world setup
    this.world = null;
    this.glassBody = null;
    this.beerParticleSystem = null;
    this.foamParticleSystem = null;
    
    // Accelerometer data
    this.gravity = { x: 0, y: 10 };
    this.accelerometerSupported = false;
    
    // Animation
    this.animationId = null;
    this.gravityReversed = false;
    
    this.init();
  }

  init() {
    this.setupPhysics();
    this.createGlass();
    this.setupAccelerometer();
    this.animate();
  }

  setupPhysics() {
    // Create Box2D world with gravity
    const gravity = new window.b2Vec2(0, 10);
    this.world = new window.b2World(gravity, true);
    
    // Set up particle system
    const particleSystemDef = new window.b2ParticleSystemDef();
    this.beerParticleSystem = this.world.CreateParticleSystem(particleSystemDef);
    
    // Beer particles (yellow/golden)
    this.beerParticleSystem.SetRadius(2.0);
    this.beerParticleSystem.SetDensity(1.0);
    
    // Foam particle system (separate for different properties)
    const foamParticleSystemDef = new window.b2ParticleSystemDef();
    this.foamParticleSystem = this.world.CreateParticleSystem(foamParticleSystemDef);
    this.foamParticleSystem.SetRadius(1.5);
    this.foamParticleSystem.SetDensity(0.3); // Lighter than beer
  }

  createGlass() {
    // Create static body for glass walls
    const bodyDef = new window.b2BodyDef();
    bodyDef.type = window.b2_staticBody;
    bodyDef.position.Set(0, 0);
    this.glassBody = this.world.CreateBody(bodyDef);

    // Glass dimensions (in world coordinates)
    const glassWidth = 8;
    const glassHeight = 15;
    const wallThickness = 0.5;
    const glassBottom = 5;

    // Bottom of glass
    this.createWall(-glassWidth/2, glassBottom, glassWidth/2, glassBottom + wallThickness);
    
    // Left wall of glass (tapered)
    this.createTaperedWall(-glassWidth/2, glassBottom, -glassWidth/2 + 1, glassBottom + glassHeight, wallThickness);
    
    // Right wall of glass (tapered)
    this.createTaperedWall(glassWidth/2, glassBottom, glassWidth/2 - 1, glassBottom + glassHeight, wallThickness);

    // Create boundaries (invisible walls to keep particles in canvas)
    this.createWall(-15, -5, 15, -4); // Top boundary
    this.createWall(-15, 25, 15, 26); // Bottom boundary
    this.createWall(-15, -5, -14, 26); // Left boundary
    this.createWall(14, -5, 15, 26); // Right boundary
  }

  createWall(x1, y1, x2, y2) {
    const shape = new window.b2PolygonShape();
    const vertices = [
      new window.b2Vec2(x1, y1),
      new window.b2Vec2(x2, y1),
      new window.b2Vec2(x2, y2),
      new window.b2Vec2(x1, y2)
    ];
    shape.Set(vertices, 4);
    this.glassBody.CreateFixture(shape, 0);
  }

  createTaperedWall(x1, y1, x2, y2, thickness) {
    const shape = new window.b2PolygonShape();
    const dx = x2 - x1;
    const dy = y2 - y1;
    const length = Math.sqrt(dx * dx + dy * dy);
    const nx = -dy / length * thickness;
    const ny = dx / length * thickness;

    const vertices = [
      new window.b2Vec2(x1, y1),
      new window.b2Vec2(x2, y2),
      new window.b2Vec2(x2 + nx, y2 + ny),
      new window.b2Vec2(x1 + nx, y1 + ny)
    ];
    shape.Set(vertices, 4);
    this.glassBody.CreateFixture(shape, 0);
  }

  setupAccelerometer() {
    if (window.DeviceMotionEvent) {
      window.addEventListener('devicemotion', (event) => {
        if (event.accelerationIncludingGravity) {
          // Convert phone acceleration to world gravity
          const x = event.accelerationIncludingGravity.x || 0;
          const y = event.accelerationIncludingGravity.y || 0;
          
          // Scale and invert for proper physics
          this.gravity.x = -x * 2;
          this.gravity.y = Math.abs(y * 2) + 5; // Keep some downward gravity
          
          this.world.SetGravity(new window.b2Vec2(this.gravity.x, this.gravity.y));
          this.accelerometerSupported = true;
          
          if (this.callbacks.onAccelerometerChange) {
            this.callbacks.onAccelerometerChange(true);
          }
        }
      });
    } else {
      // Fallback: mouse movement for desktop testing
      this.canvas.addEventListener('mousemove', (event) => {
        const rect = this.canvas.getBoundingClientRect();
        const x = (event.clientX - rect.left - rect.width / 2) / rect.width * 20;
        const y = (event.clientY - rect.top - rect.height / 2) / rect.height * 20;
        
        this.gravity.x = x;
        this.gravity.y = Math.abs(y) + 5;
        this.world.SetGravity(new window.b2Vec2(this.gravity.x, this.gravity.y));
      });
    }
  }

  pourBeer() {
    // Create beer particles
    const particleDef = new window.b2ParticleGroupDef();
    particleDef.flags = window.b2_waterParticle | window.b2_viscousParticle;
    
    // Pour from top of glass
    const shape = new window.b2PolygonShape();
    const vertices = [
      new window.b2Vec2(-2, -2),
      new window.b2Vec2(2, -2),
      new window.b2Vec2(2, 0),
      new window.b2Vec2(-2, 0)
    ];
    shape.Set(vertices, 4);
    particleDef.shape = shape;
    
    // Golden beer color
    particleDef.color = new window.b2ParticleColor(255, 193, 7, 255); // Golden color
    
    this.beerParticleSystem.CreateParticleGroup(particleDef);
    this.updateParticleCount();
  }

  addFoam() {
    // Create foam particles on top
    const particleDef = new window.b2ParticleGroupDef();
    particleDef.flags = window.b2_waterParticle;
    
    const shape = new window.b2PolygonShape();
    const vertices = [
      new window.b2Vec2(-3, -3),
      new window.b2Vec2(3, -3),
      new window.b2Vec2(3, -1),
      new window.b2Vec2(-3, -1)
    ];
    shape.Set(vertices, 4);
    particleDef.shape = shape;
    
    // White foam color
    particleDef.color = new window.b2ParticleColor(255, 255, 255, 200); // White foam
    
    this.foamParticleSystem.CreateParticleGroup(particleDef);
    this.updateParticleCount();
  }

  resetGlass() {
    // Destroy all particles
    this.beerParticleSystem.DestroyParticlesInShape(
      new window.b2PolygonShape(), 
      new window.b2Transform(new window.b2Vec2(0, 0), new window.b2Rot(0))
    );
    this.foamParticleSystem.DestroyParticlesInShape(
      new window.b2PolygonShape(), 
      new window.b2Transform(new window.b2Vec2(0, 0), new window.b2Rot(0))
    );
    this.updateParticleCount();
  }

  toggleGravity() {
    this.gravityReversed = !this.gravityReversed;
    const gravityMultiplier = this.gravityReversed ? -1 : 1;
    this.world.SetGravity(new window.b2Vec2(this.gravity.x, this.gravity.y * gravityMultiplier));
  }

  updateParticleCount() {
    const totalParticles = this.beerParticleSystem.GetParticleCount() + 
                          this.foamParticleSystem.GetParticleCount();
    if (this.callbacks.onParticleCountChange) {
      this.callbacks.onParticleCountChange(totalParticles);
    }
  }

  worldToCanvas(worldPos) {
    return {
      x: (worldPos.x + 15) * (this.canvas.width / 30),
      y: (worldPos.y + 5) * (this.canvas.height / 30)
    };
  }

  render() {
    // Clear canvas with slight trail effect
    this.ctx.fillStyle = 'rgba(26, 26, 26, 0.1)';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    // Draw glass outline
    this.drawGlass();

    // Draw beer particles
    this.drawParticles(this.beerParticleSystem, '#FFC107'); // Golden beer

    // Draw foam particles
    this.drawParticles(this.foamParticleSystem, '#FFFFFF'); // White foam
  }

  drawGlass() {
    this.ctx.strokeStyle = '#8B4513';
    this.ctx.lineWidth = 3;
    this.ctx.beginPath();
    
    // Glass outline (tapered shape)
    const bottomLeft = this.worldToCanvas({ x: -4, y: 5 });
    const bottomRight = this.worldToCanvas({ x: 4, y: 5 });
    const topLeft = this.worldToCanvas({ x: -3, y: 20 });
    const topRight = this.worldToCanvas({ x: 3, y: 20 });

    this.ctx.moveTo(bottomLeft.x, bottomLeft.y);
    this.ctx.lineTo(topLeft.x, topLeft.y);
    this.ctx.moveTo(bottomRight.x, bottomRight.y);
    this.ctx.lineTo(topRight.x, topRight.y);
    this.ctx.moveTo(bottomLeft.x, bottomLeft.y);
    this.ctx.lineTo(bottomRight.x, bottomRight.y);
    
    this.ctx.stroke();

    // Add glass shine effect
    this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
    this.ctx.lineWidth = 1;
    this.ctx.beginPath();
    this.ctx.moveTo(topLeft.x + 10, topLeft.y);
    this.ctx.lineTo(bottomLeft.x + 5, bottomLeft.y - 50);
    this.ctx.stroke();
  }

  drawParticles(particleSystem, color) {
    const positions = particleSystem.GetPositionBuffer();
    const colors = particleSystem.GetColorBuffer();
    
    if (!positions) return;

    this.ctx.fillStyle = color;
    
    for (let i = 0; i < particleSystem.GetParticleCount(); i++) {
      const pos = this.worldToCanvas({
        x: positions[i * 2],
        y: positions[i * 2 + 1]
      });

      // Use particle color if available
      if (colors) {
        const r = colors[i * 4];
        const g = colors[i * 4 + 1];
        const b = colors[i * 4 + 2];
        const a = colors[i * 4 + 3] / 255;
        this.ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${a})`;
      }

      this.ctx.beginPath();
      this.ctx.arc(pos.x, pos.y, 3, 0, Math.PI * 2);
      this.ctx.fill();
    }
  }

  animate() {
    // Step physics simulation
    this.world.Step(1/60, 8, 3);

    // Render frame
    this.render();

    // Update particle count
    this.updateParticleCount();

    // Continue animation
    this.animationId = requestAnimationFrame(() => this.animate());
  }

  destroy() {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
    }
  }
}

export default BeerGlassPhysics;
