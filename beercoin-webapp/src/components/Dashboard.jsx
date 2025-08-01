import { useState, useEffect, useRef } from 'react';
import { useWallet } from '../contexts/WalletContext';
import useContractData from '../hooks/useContractData';
import WalletDetails from './WalletDetails';

const Dashboard = () => {
  const { 
    wallet, 
    balance, 
    isRegistered, 
    username,
    isTrusted
  } = useWallet();
  
  const {
    beerBalance,
    pendingRewards,
    userInfo,
    baseRewardRate,
    referrerMultiplier,
    multiplierBase,
    claimRewards,
    refreshBalances
  } = useContractData();

  // Debug logging for userInfo
  console.log('[Dashboard] userInfo:', userInfo);
  console.log('[Dashboard] isTrusted:', isTrusted);
  console.log('[Dashboard] isRegistered:', isRegistered);
  
  const [showWalletDetails, setShowWalletDetails] = useState(false);
  const [claiming, setClaiming] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Beer glass physics simulation - refs and state
  const canvasRef = useRef(null);
  const beerGlassRef = useRef(null);

  // EXACT COPY of beer.html - Load LiquidFun dynamically (REVERTED to working pattern)
  function loadLiquidFun() {
    return new Promise((resolve, reject) => {
      // Try multiple paths (EXACT COPY from beer.html)
      const paths = [
        '/liquidfun_v1.1.0.min.js',
        './liquidfun_v1.1.0.min.js',
        'liquidfun_v1.1.0.min.js'
      ];
      
      let currentPath = 0;
      
      function tryPath() {
        if (currentPath >= paths.length) {
          reject(new Error('All paths failed'));
          return;
        }
        
        const script = document.createElement('script');
        script.src = paths[currentPath];
        
        script.onload = () => {
          console.log(`LiquidFun loaded from: ${paths[currentPath]}`);
          resolve();
        };
        
        script.onerror = () => {
          console.warn(`Failed to load from: ${paths[currentPath]}`);
          currentPath++;
          document.head.removeChild(script);
          setTimeout(tryPath, 100);
        };
        
        document.head.appendChild(script);
      }
      
      tryPath();
    });
  }

  // EXACT COPY of BeerGlass class from beer.html but adapted for React/Dashboard context
  class BeerGlass {
    constructor() {
      this.canvas = canvasRef.current;
      this.ctx = this.canvas.getContext('2d');
      
      // Try to get Box2D objects from different possible locations (EXACT COPY from beer.html)
      this.b2World = window.b2World || window.Box2D?.b2World || window.Box2D?.Dynamics?.b2World;
      this.b2Vec2 = window.b2Vec2 || window.Box2D?.b2Vec2 || window.Box2D?.Common?.Math?.b2Vec2;
      this.b2BodyDef = window.b2BodyDef || window.Box2D?.b2BodyDef || window.Box2D?.Dynamics?.b2BodyDef;
      this.b2_staticBody = window.b2_staticBody || window.Box2D?.b2_staticBody || window.Box2D?.Dynamics?.b2Body?.b2_staticBody || window.Box2D?.b2BodyType?.b2_staticBody || 0;
      this.b2PolygonShape = window.b2PolygonShape || window.Box2D?.b2PolygonShape || window.Box2D?.Collision?.Shapes?.b2PolygonShape;
      this.b2CircleShape = window.b2CircleShape || window.Box2D?.b2CircleShape || window.Box2D?.Collision?.Shapes?.b2CircleShape;
      this.b2ParticleSystemDef = window.b2ParticleSystemDef || window.Box2D?.b2ParticleSystemDef;
      this.b2ParticleGroupDef = window.b2ParticleGroupDef || window.Box2D?.b2ParticleGroupDef;
      this.b2ParticleDef = window.b2ParticleDef || window.Box2D?.b2ParticleDef;
      this.b2ParticleColor = window.b2ParticleColor || window.Box2D?.b2ParticleColor;
      this.b2_waterParticle = window.b2_waterParticle || window.Box2D?.b2_waterParticle || window.Box2D?.b2ParticleFlag?.b2_waterParticle || 1;
      this.b2_viscousParticle = window.b2_viscousParticle || window.Box2D?.b2_viscousParticle || window.Box2D?.b2ParticleFlag?.b2_viscousParticle || 64;
      this.b2Transform = window.b2Transform || window.Box2D?.b2Transform;
      this.b2Rot = window.b2Rot || window.Box2D?.b2Rot;
      
      if (!this.b2World) {
        console.error('Could not find b2World. Available objects:', Object.keys(window).filter(k => k.startsWith('b2')));
        throw new Error('Box2D objects not available');
      }
      
      // Debug: Check which Box2D objects we have
      const boxObjects = {
        b2World: !!this.b2World,
        b2Vec2: !!this.b2Vec2,
        b2BodyDef: !!this.b2BodyDef,
        b2_staticBody: !!this.b2_staticBody,
        b2PolygonShape: !!this.b2PolygonShape,
        b2CircleShape: !!this.b2CircleShape,
        b2ParticleSystemDef: !!this.b2ParticleSystemDef,
        b2ParticleGroupDef: !!this.b2ParticleGroupDef,
        b2ParticleColor: !!this.b2ParticleColor,
        b2_waterParticle: !!this.b2_waterParticle,
        b2_viscousParticle: !!this.b2_viscousParticle,
        b2Transform: !!this.b2Transform,
        b2Rot: !!this.b2Rot
      };
      console.log('Box2D objects availability:', boxObjects);
      
      if (!this.b2PolygonShape) {
        console.error('b2PolygonShape not found! Checking alternatives...');
        // Try more fallback locations
        this.b2PolygonShape = window.b2PolygonShape || 
                             window.Box2D?.b2PolygonShape || 
                             window.Box2D?.Collision?.Shapes?.b2PolygonShape ||
                             window.Box2D?.Shapes?.b2PolygonShape;
        console.log('After fallback search, b2PolygonShape:', this.b2PolygonShape);
      }
      
      console.log('Box2D objects found successfully!');
      
      // Physics world setup
      this.world = null;
      this.glassBody = null;
      this.beerParticleSystem = null;
      this.foamParticleSystem = null;
      
      // Accelerometer data
      this.gravity = { x: 0, y: -10 };
      this.accelerometerSupported = false;
      this.accelerometerEnabled = true; // Can be toggled on/off
      
      // Animation
      this.animationId = null;
      this.particleCount = 0;
      this.gravityReversed = false;
      this.simulationSpeed = 1.2; // Default simulation speed multiplier (updated to match UI)
      
      // Glass dimensions and position - smaller for dashboard
      this.glassWidth = 3; // Smaller width for dashboard
      this.glassHeight = 8; // Smaller height for dashboard
      this.glassX = 0; // X position offset
      this.glassY = 2; // Y position (bottom of glass)
      
      // Glass image overlay
      this.glassImage = null;
      this.glassImageOpacity = 0.5;
      this.loadGlassImage();
      
      this.init();
    }

    // Helper function to set polygon shape vertices (EXACT COPY from beer.html)
    setPolygonVertices(shape, vertices) {
      if (typeof shape.Set === 'function') {
        shape.Set(vertices, vertices.length);
      } else if (typeof shape.SetAsArray === 'function') {
        shape.SetAsArray(vertices);
      } else if (typeof shape.SetVertices === 'function') {
        shape.SetVertices(vertices);
      } else {
        // Fallback: try to set vertices directly
        shape.vertices = vertices;
        console.warn('Using fallback vertex setting for polygon shape');
      }
    }

    init() {
      this.setupPhysics();
      this.createGlass();
      this.setupAccelerometer();
      this.animate();
    }

    setupPhysics() {
      // Create Box2D world with gravity pointing down (negative Y in Box2D coordinates)
      const gravity = new this.b2Vec2(0, -10);
      this.world = new this.b2World(gravity, true);
      
      console.log('Physics world created successfully');
      
      // Set up particle system (unified system for both beer and foam)
      const particleSystemDef = new this.b2ParticleSystemDef();
      particleSystemDef.set_radius(0.15); // Standard radius for all particles
      this.particleSystem = this.world.CreateParticleSystem(particleSystemDef);
      this.particleSystem.SetMaxParticleCount(4000); // Smaller limit for dashboard
      
      // Set initial physics parameters for stability
      this.updatePhysicsParameters();
      
      console.log('Unified particle system created for beer and foam');
    }

    updatePhysicsParameters() {
      const damping = 0.2;
      const viscosity = 0.1;
      
      try {
        // Set damping (reduces velocity over time - helps with wobbling)
        if (typeof this.particleSystem.SetDamping === 'function') {
          this.particleSystem.SetDamping(damping);
          console.log('Damping set to:', damping);
        }
        
        // Set viscosity (controls fluid thickness - helps with stability)
        if (typeof this.particleSystem.SetViscousStrength === 'function') {
          this.particleSystem.SetViscousStrength(viscosity);
          console.log('Viscosity set to:', viscosity);
        }
        
        // Set additional stability parameters if available
        if (typeof this.particleSystem.SetStaticPressureStrength === 'function') {
          this.particleSystem.SetStaticPressureStrength(0.2); // Helps with pressure stability
        }
        
        if (typeof this.particleSystem.SetStaticPressureRelaxation === 'function') {
          this.particleSystem.SetStaticPressureRelaxation(0.4); // Pressure relaxation
        }
        
      } catch (e) {
        console.warn('Some physics parameters not supported:', e.message);
      }
    }

    loadGlassImage() {
      this.glassImage = new Image();
      this.glassImage.onload = () => {
        console.log('✅ Beer glass image loaded successfully');
        console.log('Image dimensions:', this.glassImage.naturalWidth, 'x', this.glassImage.naturalHeight);
      };
      
      const imagePaths = [
        './beerglass.png',
        'beerglass.png',
        '/beerglass.png',
        '../beerglass.png'
      ];
      
      let currentPathIndex = 0;
      
      const tryNextPath = () => {
        if (currentPathIndex >= imagePaths.length) {
          console.warn('All image paths failed, using outline only');
          this.glassImage = null;
          return;
        }
        
        const path = imagePaths[currentPathIndex];
        console.log(`Trying to load glass image from: ${path}`);
        
        this.glassImage.onerror = () => {
          console.warn(`Failed to load from: ${path}`);
          currentPathIndex++;
          setTimeout(tryNextPath, 100);
        };
        
        this.glassImage.src = path;
      };
      
      tryNextPath();
    }

    createGlass() {
      // Create static body for glass walls
      const bodyDef = new this.b2BodyDef();
      bodyDef.type = this.b2_staticBody || 0; // Use 0 as fallback for static body
      
      // Set position using different methods depending on API
      if (bodyDef.position && typeof bodyDef.position.Set === 'function') {
        bodyDef.position.Set(0, 0);
      } else if (bodyDef.position) {
        bodyDef.position.x = 0;
        bodyDef.position.y = 0;
      } else {
        // Create position vector if it doesn't exist
        bodyDef.position = new this.b2Vec2(0, 0);
      }
      
      this.glassBody = this.world.CreateBody(bodyDef);

      console.log('Creating compact glass walls for dashboard...');

      // Use compact dimensions for dashboard
      this.createSimpleWall(0, 3, 4, 0.5); // Bottom - smaller
      this.createSimpleWall(-1.8, 7, 0.3, 8); // Left - smaller
      this.createSimpleWall(1.8, 7, 0.3, 8); // Right - smaller
      
      console.log('Compact glass creation complete');
    }

    createSimpleWall(centerX, centerY, width, height) {
      const shape = new this.b2PolygonShape();
      // Use SetAsBox which is more reliable than setting vertices manually
      if (typeof shape.SetAsBox === 'function') {
        shape.SetAsBox(width / 2, height / 2, new this.b2Vec2(centerX, centerY), 0);
      } else {
        // Fallback: manual vertex setting
        const vertices = [
          new this.b2Vec2(centerX - width/2, centerY - height/2),
          new this.b2Vec2(centerX + width/2, centerY - height/2),
          new this.b2Vec2(centerX + width/2, centerY + height/2),
          new this.b2Vec2(centerX - width/2, centerY + height/2)
        ];
        this.setPolygonVertices(shape, vertices);
      }
      
      const fixture = this.glassBody.CreateFixture(shape, 0);
      console.log(`Created wall at (${centerX}, ${centerY}) with size ${width}x${height}`);
      return fixture;
    }

    setupAccelerometer() {
      if (window.DeviceMotionEvent) {
        window.addEventListener('devicemotion', (event) => {
          if (event.accelerationIncludingGravity && this.accelerometerEnabled) {
            // Get raw accelerometer data
            const rawX = event.accelerationIncludingGravity.x || 0;
            const rawY = event.accelerationIncludingGravity.y || 0;
            
            // Add deadzone to ignore small movements (phone at rest)
            const deadzone = 1.0;
            const filteredX = Math.abs(rawX) > deadzone ? rawX : 0;
            const filteredY = Math.abs(rawY) > deadzone ? rawY : 0;
            
            const gravityScale = 0.4; // Reduce sensitivity for dashboard
            const baseGravity = -10;
            
            // Horizontal gravity based on phone tilt
            const gravityX = -filteredX * gravityScale;
            
            // Vertical gravity - always keep some downward force
            let gravityY = baseGravity;
            if (Math.abs(filteredY) > 2) { // Only adjust if significant tilt
              gravityY = filteredY > 0 ? baseGravity : baseGravity * 0.3; // Reduce but don't reverse
            }
            
            // Apply the new gravity
            this.world.SetGravity(new this.b2Vec2(gravityX, gravityY));
            this.accelerometerSupported = true;
          }
        });
      } else {
        // Fallback: mouse movement for desktop testing
        this.canvas.addEventListener('mousemove', (event) => {
          const rect = this.canvas.getBoundingClientRect();
          const x = (event.clientX - rect.left - rect.width / 2) / rect.width * 10;
          const y = (event.clientY - rect.top - rect.height / 2) / rect.height * 10;
          
          this.gravity.x = x;
          this.gravity.y = Math.abs(y) + 5;
          this.world.SetGravity(new this.b2Vec2(this.gravity.x, this.gravity.y));
        });
      }
    }

    fillGlassWithBeer() {
      console.log('fillGlassWithBeer called - creating compact grid of beer particles');
      
      const particleSpacing = 0.3; // Denser for dashboard
      
      // Compact glass dimensions
      const glassLeft = -1.5;
      const glassRight = 1.5;
      const glassBottom = 3.3;
      const glassHeight = 4; // Fill about half the glass
      
      let particleCount = 0;
      
      // Create grid of particles
      for (let y = glassBottom; y < glassBottom + glassHeight; y += particleSpacing) {
        for (let x = glassLeft; x <= glassRight; x += particleSpacing) {
          try {
            const color = new this.b2ParticleColor(
              255, 
              193 + Math.random() * 30, // Slight color variation
              7 + Math.random() * 20, 
              255
            );
            
            // Create particle group definition
            const pgd = new this.b2ParticleGroupDef();
            const shape = new this.b2CircleShape();
            
            // Small radius for grid particles
            const radius = 0.1 + Math.random() * 0.05;
            shape.set_m_radius(radius);
            shape.set_m_p(new this.b2Vec2(
              x + (Math.random() - 0.5) * 0.1, // Small random offset
              y + (Math.random() - 0.5) * 0.1
            ));
            
            pgd.set_shape(shape);
            pgd.set_color(color);
            pgd.set_flags(0);
            
            // Create the particle group in unified system
            const group = this.particleSystem.CreateParticleGroup(pgd);
            particleCount++;
            
          } catch (e) {
            console.error('Failed to create grid beer particle at', x, y, ':', e);
            break;
          }
        }
      }
      
      console.log(`Created ${particleCount} beer particles in compact grid pattern`);
    }

    addFoamLayer() {
      console.log('addFoamLayer called - creating compact foam layer');
      
      const particleSpacing = 0.25; // Dense foam layer
      
      // Compact glass dimensions
      const glassLeft = -1.4;
      const glassRight = 1.4;
      const foamBottom = 7.5; // Above the beer level
      const foamHeight = 1; // Thin foam layer
      
      let particleCount = 0;
      
      // Create grid of foam particles
      for (let y = foamBottom; y < foamBottom + foamHeight; y += particleSpacing) {
        for (let x = glassLeft; x <= glassRight; x += particleSpacing) {
          try {
            const color = new this.b2ParticleColor(
              255, 
              255, 
              255, 
              180 + Math.random() * 40
            );
            
            // Create particle group definition
            const pgd = new this.b2ParticleGroupDef();
            const shape = new this.b2CircleShape();
            
            // Smaller radius for foam particles
            const radius = 0.06 + Math.random() * 0.03;
            shape.set_m_radius(radius);
            shape.set_m_p(new this.b2Vec2(
              x + (Math.random() - 0.5) * 0.1,
              y + (Math.random() - 0.5) * 0.1
            ));
            
            pgd.set_shape(shape);
            pgd.set_color(color);
            pgd.set_flags(0);
            
            // Create the particle group in unified system
            const group = this.particleSystem.CreateParticleGroup(pgd);
            particleCount++;
            
          } catch (e) {
            console.error('Failed to create foam particle group at', x, y, ':', e);
            break;
          }
        }
      }
      
      console.log(`Created ${particleCount} foam particles in compact layer`);
    }

    worldToCanvas(worldPos) {
      return {
        x: (worldPos.x + 8) * (this.canvas.width / 16),
        y: this.canvas.height - (worldPos.y + 2) * (this.canvas.height / 16) // Flip Y coordinate
      };
    }

    render() {
      // Clear canvas with transparent background
      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

      // Draw all particles from the unified system (each with their own color)
      this.drawAllParticles();

      // Draw glass image overlay
      this.drawGlassOverlay();
    }

    drawGlassOverlay() {
      // Only draw if image is properly loaded and not in broken state
      if (this.glassImage && this.glassImage.complete && this.glassImage.naturalWidth > 0 && this.glassImageOpacity > 0) {
        // Save current canvas state
        const oldAlpha = this.ctx.globalAlpha;
        
        // Set opacity for glass image
        this.ctx.globalAlpha = this.glassImageOpacity;
        
        // Calculate glass image position and size to match the physics glass
        const halfWidth = this.glassWidth / 2;
        const topLeft = this.worldToCanvas({ x: this.glassX - halfWidth, y: this.glassY + this.glassHeight });
        const bottomRight = this.worldToCanvas({ x: this.glassX + halfWidth, y: this.glassY });
        
        const imageWidth = bottomRight.x - topLeft.x;
        const imageHeight = bottomRight.y - topLeft.y;
        
        // Draw the beer glass image overlay
        this.ctx.drawImage(this.glassImage, topLeft.x, topLeft.y, imageWidth, imageHeight);
        
        // Restore canvas state
        this.ctx.globalAlpha = oldAlpha;
      }
    }

    drawAllParticles() {
      const particleCount = this.particleSystem.GetParticleCount();
      if (particleCount === 0) return;

      // Debug module availability
      if (typeof window.Module === 'undefined') {
        console.error('Module not available for memory access');
        return;
      }
      
      try {
        // Get position buffer
        const posOffset = this.particleSystem.GetPositionBuffer();
        
        if (posOffset && typeof posOffset === 'object' && posOffset.e !== undefined) {
          // Check if we can access memory
          if (!window.Module.HEAPU8 || !window.Module.HEAPU8.buffer) {
            console.error('Module.HEAPU8 buffer not available');
            return;
          }
          
          // Read position data
          const positions = new Float32Array(window.Module.HEAPU8.buffer, posOffset.e, particleCount * 2);
          
          // Try to get color buffer
          const colorOffset = this.particleSystem.GetColorBuffer();
          let colors = null;
          
          if (colorOffset && colorOffset.e !== undefined) {
            colors = new Uint8Array(window.Module.HEAPU8.buffer, colorOffset.e, particleCount * 4);
          }
          
          let renderedCount = 0;
          for (let i = 0; i < particleCount; i++) {
            // Get physics coordinates
            const physX = positions[i * 2];
            const physY = positions[i * 2 + 1];
            
            // Skip particles with invalid positions
            if (isNaN(physX) || isNaN(physY)) {
              continue;
            }
            
            // Convert to canvas coordinates
            const canvasPos = this.worldToCanvas({ x: physX, y: physY });
            
            // Check if particle is visible (more liberal bounds)
            if (canvasPos.x >= -20 && canvasPos.x <= this.canvas.width + 20 &&
                canvasPos.y >= -20 && canvasPos.y <= this.canvas.height + 20) {
              
              // Set particle color (use color buffer if available, otherwise determine by position)
              if (colors) {
                const r = colors[i * 4];
                const g = colors[i * 4 + 1];
                const b = colors[i * 4 + 2];
                const a = colors[i * 4 + 3];
                this.ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${a/255})`;
              } else {
                // Determine color by position - foam particles are higher up in the glass
                if (physY > 7) {
                  // Foam particles (white/cream)
                  this.ctx.fillStyle = `rgba(255, 255, 255, 0.9)`;
                } else {
                  // Beer particles (golden yellow)
                  this.ctx.fillStyle = `rgba(255, 193, 7, 0.95)`;
                }
              }
              
              this.ctx.beginPath();
              this.ctx.arc(canvasPos.x, canvasPos.y, 
                physY > 7 ? 2 : 3, // Foam particles slightly smaller
                0, Math.PI * 2);
              this.ctx.fill();
              renderedCount++;
            }
          }
          
          return; // Success - exit early
          
        }
        
      } catch (error) {
        console.error('Error accessing particle data:', error);
      }
      
      // Fallback: Draw test particles to verify rendering works
      this.ctx.fillStyle = '#FFC107';
      
      // Draw test particles at known positions
      for (let i = 0; i < 3; i++) {
        const testPos = this.worldToCanvas({ x: i * 0.5 - 1, y: 5 + i });
        this.ctx.beginPath();
        this.ctx.arc(testPos.x, testPos.y, 4, 0, Math.PI * 2);
        this.ctx.fill();
      }
    }

    animate() {
      // Step physics simulation with speed multiplier
      try {
        const timeStep = (1/60) * this.simulationSpeed;
        this.world.Step(timeStep, 8, 3);
      } catch (e) {
        console.error('Physics step failed:', e);
      }

      // Render frame
      this.render();

      // Continue animation
      this.animationId = requestAnimationFrame(() => this.animate());
    }

    destroy() {
      if (this.animationId) {
        cancelAnimationFrame(this.animationId);
      }
    }
  }

  // Initialize beer glass physics simulation - EXACT COPY from beer.html initialization pattern
  useEffect(() => {
    if (!canvasRef.current) return;
    
    // Initialize when component mounts (EXACT COPY from beer.html)
    const initializeSimulation = async () => {
      console.log('Dashboard loaded, attempting to load LiquidFun...');
      
      try {
        // Try to load LiquidFun
        await loadLiquidFun();
        
        // Wait a bit more for the library to fully initialize (EXACT COPY from beer.html)
        setTimeout(() => {
          console.log('Checking available objects:');
          console.log('b2World:', typeof window.b2World);
          console.log('window.b2World:', typeof window.b2World);
          console.log('Box2D:', typeof window.Box2D);
          console.log('window.Box2D:', typeof window.Box2D);
          
          // Check what's actually available in the global scope
          const box2dObjects = Object.keys(window).filter(key => key.startsWith('b2'));
          console.log('Available b2 objects:', box2dObjects);
          
          if (typeof window.b2World !== 'undefined' || typeof window.b2World !== 'undefined') {
            console.log('LiquidFun initialized successfully!');
            beerGlassRef.current = new BeerGlass();
            
            // Auto-deploy beer and foam on startup
            setTimeout(() => {
              if (beerGlassRef.current) {
                console.log('Auto-deploying beer and foam...');
                beerGlassRef.current.fillGlassWithBeer();
                // Shorter delays for compact display
                setTimeout(() => beerGlassRef.current.addFoamLayer(), 1500);
                setTimeout(() => beerGlassRef.current.addFoamLayer(), 1700);
              }
            }, 1000);
          } else if (typeof window.Box2D !== 'undefined') {
            console.log('Box2D available, trying alternative initialization...');
            // Try to use Box2D module if b2World is not directly available (EXACT COPY from beer.html)
            // Map all necessary Box2D objects to window
            window.b2World = window.Box2D.b2World || window.Box2D.Dynamics?.b2World;
            window.b2Vec2 = window.Box2D.b2Vec2 || window.Box2D.Common?.Math?.b2Vec2;
            window.b2BodyDef = window.Box2D.b2BodyDef || window.Box2D.Dynamics?.b2BodyDef;
            window.b2_staticBody = window.Box2D.b2_staticBody || window.Box2D.Dynamics?.b2Body?.b2_staticBody || window.Box2D.b2BodyType?.b2_staticBody || 0;
            window.b2PolygonShape = window.Box2D.b2PolygonShape || window.Box2D.Collision?.Shapes?.b2PolygonShape;
            window.b2CircleShape = window.Box2D.b2CircleShape || window.Box2D.Collision?.Shapes?.b2CircleShape;
            window.b2ParticleSystemDef = window.Box2D.b2ParticleSystemDef;
            window.b2ParticleGroupDef = window.Box2D.b2ParticleGroupDef;
            window.b2ParticleDef = window.Box2D.b2ParticleDef;
            window.b2ParticleColor = window.Box2D.b2ParticleColor;
            window.b2_waterParticle = window.Box2D.b2_waterParticle || window.Box2D.b2ParticleFlag?.b2_waterParticle || 1;
            window.b2_viscousParticle = window.Box2D.b2_viscousParticle || window.Box2D.b2ParticleFlag?.b2_viscousParticle || 64;
            window.b2Transform = window.Box2D.b2Transform || window.Box2D.Common?.Math?.b2Transform;
            window.b2Rot = window.Box2D.b2Rot || window.Box2D.Common?.Math?.b2Rot;
            
            console.log('Mapped Box2D objects to window:', {
              b2World: !!window.b2World,
              b2Vec2: !!window.b2Vec2,
              b2BodyDef: !!window.b2BodyDef,
              b2PolygonShape: !!window.b2PolygonShape,
              b2CircleShape: !!window.b2CircleShape,
              b2ParticleSystemDef: !!window.b2ParticleSystemDef
            });
            
            if (window.b2World && window.b2Vec2 && window.b2PolygonShape) {
              console.log('All required Box2D objects mapped successfully, creating BeerGlass...');
              beerGlassRef.current = new BeerGlass();
              
              // Auto-deploy beer and foam on startup
              setTimeout(() => {
                if (beerGlassRef.current) {
                  console.log('Auto-deploying beer and foam...');
                  beerGlassRef.current.fillGlassWithBeer();
                  setTimeout(() => beerGlassRef.current.addFoamLayer(), 1500);
                  setTimeout(() => beerGlassRef.current.addFoamLayer(), 1700);
                }
              }, 1000);
            } else {
              console.error('Could not initialize all required Box2D objects');
              console.log('Missing objects:', {
                b2World: !window.b2World,
                b2Vec2: !window.b2Vec2,
                b2PolygonShape: !window.b2PolygonShape
              });
            }
          } else {
            console.error('LiquidFun loaded but b2World not available');
            console.log('Available global objects:', Object.keys(window).slice(0, 20));
          }
        }, 500); // EXACT COPY from beer.html - 500ms timeout
        
      } catch (error) {
        console.error('Failed to load LiquidFun:', error);
        console.log('Beer glass simulation disabled - LiquidFun not available');
      }
    };

    initializeSimulation();

    // Cleanup on unmount
    return () => {
      if (beerGlassRef.current) {
        beerGlassRef.current.destroy();
      }
    };
  }, []);

  if (!wallet) {
    return null;
  }

  const handleClaimRewards = async () => {
    try {
      setClaiming(true);
      setError('');
      setSuccess('');
      
      await claimRewards();
      setSuccess('Rewards claimed successfully!');
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccess('');
      }, 3000);
    } catch (err) {
      setError(err.message || 'Failed to claim rewards');
      
      // Clear error message after 3 seconds
      setTimeout(() => {
        setError('');
      }, 3000);
    } finally {
      setClaiming(false);
    }
  };

  const handleRefresh = async () => {
    try {
      await refreshBalances();
    } catch (err) {
      console.error('Error refreshing balances:', err);
    }
  };

  const formatAddress = (address) => {
    if (!address) return '';
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
  };

  return (
    <div>
      {/* Balance Cards */}
      <div className="grid grid-cols-1 gap-4 mb-6">
        {/* BEER Balance with Interactive Glass */}
        <div className="beer-card">
          <div className="flex justify-between items-start gap-4">
            {/* Balance Info */}
            <div className="flex-1">
              <div className="flex justify-between items-center mb-2">
                <h3 className="text-lg font-medium">BEER Balance</h3>
                <button 
                  onClick={handleRefresh}
                  className="p-2 text-primary hover:text-primary/80"
                >
                  🔄
                </button>
              </div>
              <p className="beer-balance mb-1">{parseFloat(beerBalance).toFixed(4)} BEER</p>
              <p className="text-sm text-muted-foreground">≈ {parseFloat(beerBalance).toFixed(2)} BEER</p>
              <p className="text-xs text-muted-foreground mt-2">🍺 Tilt your phone to move the beer around!</p>
            </div>
            
            {/* Interactive Beer Glass */}
            <div className="flex-shrink-0">
              <canvas 
                ref={canvasRef}
                width="120" 
                height="160"
                className="rounded-lg border border-primary/20 bg-gradient-to-b from-amber-50 to-amber-100"
                style={{ 
                  background: 'linear-gradient(135deg, #1a1a1a, #2a2a2a)',
                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)'
                }}
              />
            </div>
          </div>
        </div>
        
        {/* Pending Rewards */}
        {isRegistered && (
          <div className="beer-card">
            <h3 className="text-lg font-medium mb-2">Pending Rewards</h3>
            <p className="beer-balance mb-1">{parseFloat(pendingRewards).toFixed(4)} BEER</p>
            <p className="text-sm text-muted-foreground mb-4">Claimable now</p>
            
            {/* Referral Information for Trusted Users */}
            {isTrusted && (
              <div className="mb-4 p-3 bg-primary/5 rounded-lg border border-primary/20">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-muted-foreground">Referrals:</span>
                  <span className="text-sm font-medium">
                    {userInfo ? userInfo.referralCount || 0 : 'Loading...'} users
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Issuance Multiplier:</span>
                  <span className="text-sm font-medium text-primary">
                    {userInfo && referrerMultiplier && multiplierBase
                      ? `${(1 + ((userInfo.referralCount || 0) * referrerMultiplier) / multiplierBase).toFixed(1)}x`
                      : 'Loading...'
                    }
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {userInfo && referrerMultiplier && multiplierBase
                    ? `Base rate + ${(((userInfo.referralCount || 0) * referrerMultiplier) / multiplierBase).toFixed(1)}x bonus from referrals`
                    : 'Loading multiplier information...'
                  }
                </p>
              </div>
            )}
            
            <button
              className="beer-button w-full"
              onClick={handleClaimRewards}
              disabled={claiming || parseFloat(pendingRewards) <= 0}
            >
              {claiming ? 'Claiming...' : 'Claim Rewards'}
            </button>
          </div>
        )}
        
        {/* xDAI Balance */}
        <div className="beer-card">
          <h3 className="text-lg font-medium mb-2">xDAI Balance</h3>
          <p className="beer-balance mb-1">{parseFloat(balance).toFixed(4)} xDAI</p>
          <p className="text-sm text-muted-foreground">For transaction fees</p>
        </div>
      </div>
      
      {/* User Info */}
      {isRegistered ? (
        <div className="beer-card mb-6">
          <h2 className="text-xl font-bold mb-4">User Information</h2>
          
          <div className="mb-4">
            <div className="flex justify-between items-center mb-2">
              <span className="text-muted-foreground">Username:</span>
              <span className="font-medium">{username}</span>
            </div>
          </div>
          
          <div className="mb-4">
            <div className="flex justify-between items-center mb-2">
              <span className="text-muted-foreground">Status:</span>
              <span className="font-medium">
                {isTrusted ? (
                  <span className="text-primary">Trusted User</span>
                ) : (
                  <span>Regular User</span>
                )}
              </span>
            </div>
          </div>
          
          <div className="mb-4">
            <div className="flex justify-between items-center mb-2">
              <span className="text-muted-foreground">Wallet:</span>
              <span className="font-mono">{formatAddress(wallet.address)}</span>
            </div>
          </div>
        </div>
      ) : (
        <div className="beer-card mb-6">
          <h2 className="text-xl font-bold mb-4">Not Registered</h2>
          <p className="text-muted-foreground mb-4">
            You need to register with a referral from a trusted user to start earning BEER tokens.
          </p>
          <button 
            className="beer-button w-full"
            onClick={() => window.location.href = '/register'}
          >
            Register Now
          </button>
        </div>
      )}
      
      {/* Wallet Details Toggle */}
      <button
        className="beer-button-secondary w-full mb-6"
        onClick={() => setShowWalletDetails(!showWalletDetails)}
      >
        {showWalletDetails ? 'Hide Wallet Details' : 'Show Wallet Details'}
      </button>
      
      {/* Wallet Details */}
      {showWalletDetails && <WalletDetails />}
      
      {/* Error and Success Messages */}
      {error && (
        <div className="beer-toast bg-destructive text-destructive-foreground">
          {error}
        </div>
      )}
      
      {success && (
        <div className="beer-toast bg-primary text-primary-foreground">
          {success}
        </div>
      )}
    </div>
  );
};

export default Dashboard;

