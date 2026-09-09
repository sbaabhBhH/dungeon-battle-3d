// ================================
// 🎮 3D DUNGEON BATTLE GAME
// Three.js + Advanced AI
// ================================

class Game3D {
    constructor() {
        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFShadowShadowMap;
        document.getElementById('gameContainer').appendChild(this.renderer.domElement);

        // گەڕایی
        this.camera.position.set(0, 10, 25);
        this.camera.lookAt(0, 0, 0);

        // تێکە‌سازی
        this.setupLights();
        this.setupDungeon();
        
        // کڕێکارەکان
        this.player = this.createPlayer();
        this.ai = this.createAI();
        
        // کنترۆل
        this.setupControls();
        this.setupInput();
        
        // حالەت
        this.gameState = 'PLAYING';
        this.gameStartTime = Date.now();
        this.stats = {
            damageDealt: 0,
            damageTaken: 0,
            kills: 0,
            comboCount: 0,
            comboTimer: 0
        };

        // Particles
        this.particles = [];
        this.effects = [];

        // Animation loop
        this.animate();
        
        // Resize handler
        window.addEventListener('resize', () => this.onWindowResize());
    }

    setupLights() {
        // Ambient light
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
        this.scene.add(ambientLight);

        // Main directional light
        const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
        directionalLight.position.set(20, 30, 20);
        directionalLight.castShadow = true;
        directionalLight.shadow.mapSize.width = 2048;
        directionalLight.shadow.mapSize.height = 2048;
        directionalLight.shadow.camera.near = 0.5;
        directionalLight.shadow.camera.far = 500;
        directionalLight.shadow.camera.left = -100;
        directionalLight.shadow.camera.right = 100;
        directionalLight.shadow.camera.top = 100;
        directionalLight.shadow.camera.bottom = -100;
        this.scene.add(directionalLight);

        // Spotlight for drama
        const spotlight = new THREE.SpotLight(0xff4444, 0.8);
        spotlight.position.set(-30, 40, 0);
        spotlight.castShadow = true;
        spotlight.angle = Math.PI / 6;
        this.scene.add(spotlight);

        // Background
        this.scene.background = new THREE.Color(0x0a0a0a);
        this.scene.fog = new THREE.Fog(0x0a0a0a, 100, 150);
    }

    setupDungeon() {
        // Arena floor
        const floorGeometry = new THREE.PlaneGeometry(80, 80);
        const floorMaterial = new THREE.MeshStandardMaterial({
            color: 0x1a1a1a,
            metalness: 0.2,
            roughness: 0.8
        });
        const floor = new THREE.Mesh(floorGeometry, floorMaterial);
        floor.rotation.x = -Math.PI / 2;
        floor.receiveShadow = true;
        this.scene.add(floor);

        // Arena walls
        this.createArenaWalls();

        // Decorative pillars
        this.createPillars();

        // Environmental effects
        this.createEnvironment();
    }

    createArenaWalls() {
        const wallHeight = 20;
        const wallThickness = 1;
        const arenaSize = 40;

        const wallGeometry = new THREE.BoxGeometry(arenaSize * 2 + wallThickness * 2, wallHeight, wallThickness);
        const wallMaterial = new THREE.MeshStandardMaterial({
            color: 0x2a2a2a,
            metalness: 0.4,
            roughness: 0.6
        });

        // Front wall
        const frontWall = new THREE.Mesh(wallGeometry, wallMaterial);
        frontWall.position.set(0, wallHeight / 2, -arenaSize);
        frontWall.castShadow = true;
        frontWall.receiveShadow = true;
        this.scene.add(frontWall);

        // Back wall
        const backWall = new THREE.Mesh(wallGeometry, wallMaterial);
        backWall.position.set(0, wallHeight / 2, arenaSize);
        backWall.castShadow = true;
        backWall.receiveShadow = true;
        this.scene.add(backWall);

        // Side walls
        const sideWallGeometry = new THREE.BoxGeometry(wallThickness, wallHeight, arenaSize * 2 + wallThickness * 2);
        
        const leftWall = new THREE.Mesh(sideWallGeometry, wallMaterial);
        leftWall.position.set(-arenaSize, wallHeight / 2, 0);
        leftWall.castShadow = true;
        leftWall.receiveShadow = true;
        this.scene.add(leftWall);

        const rightWall = new THREE.Mesh(sideWallGeometry, wallMaterial);
        rightWall.position.set(arenaSize, wallHeight / 2, 0);
        rightWall.castShadow = true;
        rightWall.receiveShadow = true;
        this.scene.add(rightWall);
    }

    createPillars() {
        const positions = [
            [-20, 0, -20], [20, 0, -20],
            [-20, 0, 20], [20, 0, 20],
            [-15, 0, 0], [15, 0, 0]
        ];

        positions.forEach(pos => {
            const pillarGeometry = new THREE.CylinderGeometry(2, 2.5, 30, 8);
            const pillarMaterial = new THREE.MeshStandardMaterial({
                color: 0x3a3a3a,
                metalness: 0.6,
                roughness: 0.4
            });
            const pillar = new THREE.Mesh(pillarGeometry, pillarMaterial);
            pillar.position.set(pos[0], pos[1] + 15, pos[2]);
            pillar.castShadow = true;
            pillar.receiveShadow = true;
            this.scene.add(pillar);
        });
    }

    createEnvironment() {
        // Glowing orbs
        for (let i = 0; i < 5; i++) {
            const orbGeometry = new THREE.SphereGeometry(1.5, 32, 32);
            const orbMaterial = new THREE.MeshStandardMaterial({
                color: new THREE.Color().setHSL(Math.random(), 0.8, 0.6),
                emissive: new THREE.Color().setHSL(Math.random(), 0.8, 0.4),
                metalness: 0.9,
                roughness: 0.1
            });
            const orb = new THREE.Mesh(orbGeometry, orbMaterial);
            orb.position.set(
                (Math.random() - 0.5) * 60,
                5 + Math.random() * 20,
                (Math.random() - 0.5) * 60
            );
            orb.castShadow = true;
            this.scene.add(orb);
        }
    }

    createPlayer() {
        const playerGroup = new THREE.Group();
        playerGroup.position.set(-15, 0, 0);

        // Body
        const bodyGeometry = new THREE.CapsuleGeometry(1.2, 5, 4, 8);
        const bodyMaterial = new THREE.MeshStandardMaterial({
            color: 0x2563eb,
            metalness: 0.3,
            roughness: 0.4
        });
        const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
        body.castShadow = true;
        body.receiveShadow = true;
        playerGroup.add(body);

        // Head
        const headGeometry = new THREE.SphereGeometry(1, 16, 16);
        const headMaterial = new THREE.MeshStandardMaterial({
            color: 0x1e40af,
            metalness: 0.2,
            roughness: 0.5
        });
        const head = new THREE.Mesh(headGeometry, headMaterial);
        head.position.y = 3.5;
        head.castShadow = true;
        head.receiveShadow = true;
        playerGroup.add(head);

        // Sword
        const swordGeometry = new THREE.BoxGeometry(0.4, 6, 0.1);
        const swordMaterial = new THREE.MeshStandardMaterial({
            color: 0xffd700,
            metalness: 0.9,
            roughness: 0.1
        });
        const sword = new THREE.Mesh(swordGeometry, swordMaterial);
        sword.position.set(1.5, 1, 0);
        sword.castShadow = true;
        playerGroup.add(sword);

        // Shield
        const shieldGeometry = new THREE.CylinderGeometry(1.2, 1.2, 0.3, 8);
        const shieldMaterial = new THREE.MeshStandardMaterial({
            color: 0x1e40af,
            metalness: 0.4,
            roughness: 0.5,
            emissive: 0x2563eb
        });
        const shield = new THREE.Mesh(shieldGeometry, shieldMaterial);
        shield.position.set(-1.2, 1, 0);
        shield.rotation.z = Math.PI / 6;
        shield.castShadow = true;
        playerGroup.add(shield);

        this.scene.add(playerGroup);

        return {
            group: playerGroup,
            mesh: body,
            head: head,
            sword: sword,
            shield: shield,
            position: playerGroup.position,
            health: 100,
            maxHealth: 100,
            shield: 50,
            maxShield: 50,
            velocity: new THREE.Vector3(),
            speed: 0.3,
            rotation: 0,
            isAttacking: false,
            attackCooldown: 0,
            abilities: {
                slash: { cooldown: 0, maxCooldown: 15 },
                spin: { cooldown: 0, maxCooldown: 30 },
                shieldAbility: { cooldown: 0, maxCooldown: 25 },
                ultimate: { cooldown: 0, maxCooldown: 90 }
            },
            level: 1
        };
    }

    createAI() {
        const aiGroup = new THREE.Group();
        aiGroup.position.set(15, 0, 0);

        // Body
        const bodyGeometry = new THREE.CapsuleGeometry(1.5, 6, 4, 8);
        const bodyMaterial = new THREE.MeshStandardMaterial({
            color: 0xef4444,
            metalness: 0.4,
            roughness: 0.3,
            emissive: 0xc02c2c
        });
        const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
        body.castShadow = true;
        body.receiveShadow = true;
        aiGroup.add(body);

        // Head
        const headGeometry = new THREE.SphereGeometry(1.3, 16, 16);
        const headMaterial = new THREE.MeshStandardMaterial({
            color: 0xdc2626,
            metalness: 0.3,
            roughness: 0.4,
            emissive: 0xb91c1c
        });
        const head = new THREE.Mesh(headGeometry, headMaterial);
        head.position.y = 4;
        head.castShadow = true;
        head.receiveShadow = true;
        aiGroup.add(head);

        // Eyes (glowing)
        const eyeGeometry = new THREE.SphereGeometry(0.4, 8, 8);
        const eyeMaterial = new THREE.MeshStandardMaterial({
            color: 0xffff00,
            emissive: 0xff8800,
            metalness: 0.8,
            roughness: 0.2
        });
        
        const leftEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
        leftEye.position.set(-0.4, 4.8, 1.2);
        aiGroup.add(leftEye);
        
        const rightEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
        rightEye.position.set(0.4, 4.8, 1.2);
        aiGroup.add(rightEye);

        // Large sword
        const swordGeometry = new THREE.BoxGeometry(0.6, 8, 0.15);
        const swordMaterial = new THREE.MeshStandardMaterial({
            color: 0xff4400,
            metalness: 0.85,
            roughness: 0.15,
            emissive: 0xff2200
        });
        const sword = new THREE.Mesh(swordGeometry, swordMaterial);
        sword.position.set(2, 0.5, 0);
        sword.castShadow = true;
        aiGroup.add(sword);

        // Shield
        const shieldGeometry = new THREE.CylinderGeometry(1.5, 1.5, 0.4, 8);
        const shieldMaterial = new THREE.MeshStandardMaterial({
            color: 0xb91c1c,
            metalness: 0.5,
            roughness: 0.4,
            emissive: 0x7f1d1d
        });
        const shield = new THREE.Mesh(shieldGeometry, shieldMaterial);
        shield.position.set(-1.5, 1, 0);
        shield.rotation.z = Math.PI / 6;
        shield.castShadow = true;
        aiGroup.add(shield);

        this.scene.add(aiGroup);

        return {
            group: aiGroup,
            mesh: body,
            head: head,
            sword: sword,
            position: aiGroup.position,
            health: 150,
            maxHealth: 150,
            shield: 75,
            maxShield: 75,
            velocity: new THREE.Vector3(),
            speed: 0.25,
            targetDirection: new THREE.Vector3(),
            isAttacking: false,
            attackCooldown: 0,
            abilities: {
                slash: { cooldown: 0, maxCooldown: 20 },
                spin: { cooldown: 0, maxCooldown: 40 },
                shieldAbility: { cooldown: 0, maxCooldown: 30 },
                ultimate: { cooldown: 0, maxCooldown: 120 }
            },
            aiMode: 'AGGRESSIVE',
            strategyTimer: 0,
            currentStrategy: 'approach'
        };
    }

    setupControls() {
        this.keys = {
            w: false, a: false, s: false, d: false,
            q: false, e: false, r: false, space: false
        };

        window.addEventListener('keydown', (e) => {
            const key = e.key.toLowerCase();
            if (key === 'w') this.keys.w = true;
            if (key === 'a') this.keys.a = true;
            if (key === 's') this.keys.s = true;
            if (key === 'd') this.keys.d = true;
            if (key === 'q') this.keys.q = true;
            if (key === 'e') this.keys.e = true;
            if (key === 'r') this.keys.r = true;
            if (key === ' ') { this.keys.space = true; e.preventDefault(); }
        });

        window.addEventListener('keyup', (e) => {
            const key = e.key.toLowerCase();
            if (key === 'w') this.keys.w = false;
            if (key === 'a') this.keys.a = false;
            if (key === 's') this.keys.s = false;
            if (key === 'd') this.keys.d = false;
            if (key === 'q') this.keys.q = false;
            if (key === 'e') this.keys.e = false;
            if (key === 'r') this.keys.r = false;
            if (key === ' ') this.keys.space = false;
        });

        // Mouse look
        this.mouse = { x: 0, y: 0 };
        document.addEventListener('mousemove', (e) => {
            this.mouse.x = e.clientX / window.innerWidth;
            this.mouse.y = e.clientY / window.innerHeight;
        });

        // Click attack
        document.addEventListener('click', () => {
            this.playerAttack();
        });
    }

    setupInput() {
        this.isMouseLocked = false;
    }

    updatePlayer() {
        if (this.gameState !== 'PLAYING') return;

        // Movement
        const moveDirection = new THREE.Vector3();
        if (this.keys.w) moveDirection.z -= 1;
        if (this.keys.s) moveDirection.z += 1;
        if (this.keys.a) moveDirection.x -= 1;
        if (this.keys.d) moveDirection.x += 1;

        if (moveDirection.length() > 0) {
            moveDirection.normalize();
            this.player.position.addScaledVector(moveDirection, this.player.speed);
        }

        // Boundary
        this.player.position.x = THREE.MathUtils.clamp(this.player.position.x, -35, 35);
        this.player.position.z = THREE.MathUtils.clamp(this.player.position.z, -35, 35);

        // Look at camera
        const camX = (this.mouse.x - 0.5) * 60;
        const camZ = (this.mouse.y - 0.5) * 60;
        this.camera.position.lerp(new THREE.Vector3(this.player.position.x + camX, 15, this.player.position.z + 25), 0.1);
        this.camera.lookAt(this.player.position.x, 2, this.player.position.z);

        // Abilities
        if (this.keys.q) this.useAbility('slash');
        if (this.keys.e) this.useAbility('spin');
        if (this.keys.r) this.useAbility('shieldAbility');
        if (this.keys.space) this.useAbility('ultimate');

        // Update cooldowns
        Object.keys(this.player.abilities).forEach(key => {
            if (this.player.abilities[key].cooldown > 0) {
                this.player.abilities[key].cooldown--;
            }
        });

        // Shield regen
        if (this.player.shield < this.player.maxShield) {
            this.player.shield += 0.2;
        }
    }

    updateAI() {
        if (this.gameState !== 'PLAYING') return;

        const distToPlayer = this.player.position.distanceTo(this.ai.position);

        // AI Strategy
        this.ai.strategyTimer--;
        if (this.ai.strategyTimer <= 0) {
            const rand = Math.random();
            if (rand < 0.4) this.ai.currentStrategy = 'approach';
            else if (rand < 0.7) this.ai.currentStrategy = 'dodge';
            else this.ai.currentStrategy = 'circle';
            this.ai.strategyTimer = 60 + Math.random() * 60;
        }

        // AI Movement
        const direction = new THREE.Vector3().subVectors(this.player.position, this.ai.position).normalize();

        if (this.ai.currentStrategy === 'approach') {
            this.ai.position.addScaledVector(direction, this.ai.speed);
            this.ai.aiMode = 'AGGRESSIVE';
        } else if (this.ai.currentStrategy === 'dodge') {
            this.ai.position.addScaledVector(direction, -this.ai.speed * 1.5);
            this.ai.aiMode = 'DEFENSIVE';
        } else if (this.ai.currentStrategy === 'circle') {
            const perpendicular = new THREE.Vector3(-direction.z, 0, direction.x);
            this.ai.position.addScaledVector(perpendicular, this.ai.speed);
            this.ai.aiMode = 'TACTICAL';
        }

        // Boundary
        this.ai.position.x = THREE.MathUtils.clamp(this.ai.position.x, -35, 35);
        this.ai.position.z = THREE.MathUtils.clamp(this.ai.position.z, -35, 35);

        // AI Attack
        if (distToPlayer < 12 && this.ai.attackCooldown <= 0) {
            this.aiAttack();
        }

        // AI Abilities
        if (Math.random() < 0.02 && distToPlayer < 15) {
            const abilities = ['slash', 'spin', 'shieldAbility'];
            const randomAbility = abilities[Math.floor(Math.random() * abilities.length)];
            this.useAIAbility(randomAbility);
        }

        // Shield regen
        if (this.ai.shield < this.ai.maxShield) {
            this.ai.shield += 0.15;
        }

        // Update cooldowns
        Object.keys(this.ai.abilities).forEach(key => {
            if (this.ai.abilities[key].cooldown > 0) {
                this.ai.abilities[key].cooldown--;
            }
        });

        // Update UI
        document.getElementById('aiMode').textContent = this.ai.aiMode;
    }

    playerAttack() {
        if (this.gameState !== 'PLAYING') return;
        
        const distToAI = this.player.position.distanceTo(this.ai.position);
        if (distToAI < 8 && this.player.attackCooldown <= 0) {
            const damage = 10 + Math.random() * 8;
            this.damageAI(damage);
            this.player.attackCooldown = 10;
            this.stats.comboCount++;
            this.createAttackEffect(this.player.position);
            this.animateAttack(this.player);
        }
    }

    aiAttack() {
        const distToPlayer = this.player.position.distanceTo(this.ai.position);
        if (distToPlayer < 8) {
            const damage = 12 + Math.random() * 10;
            this.damagePlayer(damage);
            this.ai.attackCooldown = 15;
            this.createAttackEffect(this.ai.position);
            this.animateAttack(this.ai);
        }
    }

    useAbility(ability) {
        if (this.player.abilities[ability].cooldown > 0) return;
        if (this.gameState !== 'PLAYING') return;

        const distToAI = this.player.position.distanceTo(this.ai.position);

        switch(ability) {
            case 'slash':
                if (distToAI < 10) {
                    const damage = 20;
                    this.damageAI(damage);
                    this.createSlashEffect(this.player.position);
                }
                this.player.abilities.slash.cooldown = this.player.abilities.slash.maxCooldown;
                break;

            case 'spin':
                const spinDamage = 15;
                this.damageAI(spinDamage);
                this.createSpinEffect(this.player.position);
                this.player.abilities.spin.cooldown = this.player.abilities.spin.maxCooldown;
                break;

            case 'shieldAbility':
                this.player.shield = this.player.maxShield;
                this.createShieldEffect(this.player.position);
                this.player.abilities.shieldAbility.cooldown = this.player.abilities.shieldAbility.maxCooldown;
                break;

            case 'ultimate':
                const ultimateDamage = 50;
                this.damageAI(ultimateDamage);
                this.createUltimateEffect(this.player.position);
                this.player.abilities.ultimate.cooldown = this.player.abilities.ultimate.maxCooldown;
                this.stats.comboCount = 0;
                break;
        }
    }

    useAIAbility(ability) {
        if (this.ai.abilities[ability].cooldown > 0) return;

        const distToPlayer = this.player.position.distanceTo(this.ai.position);

        switch(ability) {
            case 'slash':
                if (distToPlayer < 10) {
                    const damage = 18;
                    this.damagePlayer(damage);
                }
                this.ai.abilities.slash.cooldown = this.ai.abilities.slash.maxCooldown;
                break;

            case 'spin':
                const spinDamage = 12;
                this.damagePlayer(spinDamage);
                this.ai.abilities.spin.cooldown = this.ai.abilities.spin.maxCooldown;
                break;

            case 'shieldAbility':
                this.ai.shield = this.ai.maxShield;
                this.ai.abilities.shieldAbility.cooldown = this.ai.abilities.shieldAbility.maxCooldown;
                break;
        }
    }

    damageAI(damage) {
        const actualDamage = Math.max(damage - (this.ai.shield / 50) * damage, 1);
        const shieldDamage = Math.min(actualDamage * 0.5, this.ai.shield);
        
        this.ai.shield -= shieldDamage;
        this.ai.health -= (actualDamage - shieldDamage);
        
        this.stats.damageDealt += actualDamage;
        this.stats.comboCount++;
        
        this.createDamageIndicator(this.ai.position, actualDamage);
        this.createBloodEffect(this.ai.position);
        
        if (this.ai.health <= 0) {
            this.endGame('PLAYER_WIN');
        }

        this.updateUI();
    }

    damagePlayer(damage) {
        const actualDamage = Math.max(damage - (this.player.shield / 50) * damage, 1);
        const shieldDamage = Math.min(actualDamage * 0.5, this.player.shield);
        
        this.player.shield -= shieldDamage;
        this.player.health -= (actualDamage - shieldDamage);
        
        this.stats.damageTaken += actualDamage;
        
        this.createDamageIndicator(this.player.position, actualDamage);
        this.createBloodEffect(this.player.position);
        
        if (this.player.health <= 0) {
            this.endGame('GAME_OVER');
        }

        this.updateUI();
    }

    createAttackEffect(position) {
        const geometry = new THREE.OctahedronGeometry(1, 3);
        const material = new THREE.MeshStandardMaterial({
            color: 0xffff00,
            emissive: 0xff8800,
            metalness: 0.8,
            roughness: 0.2
        });
        const mesh = new THREE.Mesh(geometry, material);
        mesh.position.copy(position);
        this.scene.add(mesh);

        this.effects.push({
            mesh: mesh,
            lifetime: 30,
            maxLifetime: 30,
            initialScale: 1
        });
    }

    createSlashEffect(position) {
        for (let i = 0; i < 8; i++) {
            const geometry = new THREE.BoxGeometry(0.5, 3, 0.1);
            const material = new THREE.MeshStandardMaterial({
                color: new THREE.Color().setHSL(Math.random() * 0.1 + 0.1, 1, 0.6),
                emissive: new THREE.Color().setHSL(Math.random() * 0.1 + 0.05, 1, 0.3),
                metalness: 0.9
            });
            const mesh = new THREE.Mesh(geometry, material);
            mesh.position.copy(position);
            mesh.rotation.z = (i / 8) * Math.PI * 2;
            this.scene.add(mesh);

            this.effects.push({
                mesh: mesh,
                lifetime: 20,
                maxLifetime: 20,
                velocity: new THREE.Vector3(
                    Math.cos((i / 8) * Math.PI * 2) * 0.3,
                    0.2,
                    Math.sin((i / 8) * Math.PI * 2) * 0.3
                )
            });
        }
    }

    createSpinEffect(position) {
        const spinGeometry = new THREE.TorusGeometry(3, 0.5, 8, 32);
        const spinMaterial = new THREE.MeshStandardMaterial({
            color: 0xff6600,
            emissive: 0xff4400,
            metalness: 0.7,
            roughness: 0.3
        });
        const spin = new THREE.Mesh(spinGeometry, spinMaterial);
        spin.position.copy(position);
        spin.rotation.x = Math.PI / 2;
        this.scene.add(spin);

        this.effects.push({
            mesh: spin,
            lifetime: 40,
            maxLifetime: 40,
            rotation: { x: 0, y: 0.15, z: 0 }
        });
    }

    createShieldEffect(position) {
        const shieldGeometry = new THREE.IcosahedronGeometry(4, 3);
        const shieldMaterial = new THREE.MeshStandardMaterial({
            color: 0x2196f3,
            emissive: 0x1565c0,
            metalness: 0.4,
            roughness: 0.6,
            wireframe: false
        });
        const shield = new THREE.Mesh(shieldGeometry, shieldMaterial);
        shield.position.copy(position);
        this.scene.add(shield);

        this.effects.push({
            mesh: shield,
            lifetime: 50,
            maxLifetime: 50,
            rotation: { x: 0.02, y: 0.05, z: 0.01 }
        });
    }

    createUltimateEffect(position) {
        const ultimateGeometry = new THREE.SphereGeometry(8, 16, 16);
        const ultimateMaterial = new THREE.MeshStandardMaterial({
            color: 0xffff00,
            emissive: 0xffaa00,
            metalness: 0.8,
            roughness: 0.2
        });
        const ultimate = new THREE.Mesh(ultimateGeometry, ultimateMaterial);
        ultimate.position.copy(position);
        this.scene.add(ultimate);

        this.effects.push({
            mesh: ultimate,
            lifetime: 60,
            maxLifetime: 60,
            initialScale: 0.5
        });
    }

    createBloodEffect(position) {
        for (let i = 0; i < 15; i++) {
            const geometry = new THREE.SphereGeometry(0.3, 8, 8);
            const material = new THREE.MeshStandardMaterial({
                color: 0xff0000,
                metalness: 0.3,
                roughness: 0.7
            });
            const particle = new THREE.Mesh(geometry, material);
            particle.position.copy(position);
            this.scene.add(particle);

            this.particles.push({
                mesh: particle,
                velocity: new THREE.Vector3(
                    (Math.random() - 0.5) * 0.5,
                    Math.random() * 0.4 + 0.2,
                    (Math.random() - 0.5) * 0.5
                ),
                lifetime: 100
            });
        }
    }

    createDamageIndicator(position, damage) {
        const canvas = document.createElement('canvas');
        canvas.width = 256;
        canvas.height = 128;
        const ctx = canvas.getContext('2d');
        ctx.font = 'bold 80px Arial';
        ctx.fillStyle = '#ff0000';
        ctx.textAlign = 'center';
        ctx.fillText(Math.floor(damage), 128, 90);

        const texture = new THREE.CanvasTexture(canvas);
        const geometry = new THREE.PlaneGeometry(4, 2);
        const material = new THREE.MeshBasicMaterial({ map: texture, transparent: true });
        const mesh = new THREE.Mesh(geometry, material);
        mesh.position.copy(position);
        mesh.position.y += 3;
        this.scene.add(mesh);

        this.effects.push({
            mesh: mesh,
            lifetime: 50,
            maxLifetime: 50,
            velocity: new THREE.Vector3(0, 0.05, 0)
        });
    }

    animateAttack(character) {
        const originalScale = character.mesh.scale.clone();
        character.mesh.scale.copy(originalScale).multiplyScalar(1.3);
        
        setTimeout(() => {
            character.mesh.scale.copy(originalScale);
        }, 100);
    }

    updateUI() {
        // Player
        document.getElementById('playerHealth').style.width = (this.player.health / this.player.maxHealth * 100) + '%';
        document.getElementById('playerHPText').textContent = Math.max(0, Math.floor(this.player.health)) + '/' + this.player.maxHealth;
        
        document.getElementById('playerShield').style.width = (this.player.shield / this.player.maxShield * 100) + '%';
        document.getElementById('playerShieldText').textContent = Math.max(0, Math.floor(this.player.shield)) + '/' + this.player.maxShield;

        // AI
        document.getElementById('aiHealth').style.width = (this.ai.health / this.ai.maxHealth * 100) + '%';
        document.getElementById('aiHPText').textContent = Math.max(0, Math.floor(this.ai.health)) + '/' + this.ai.maxHealth;
        
        document.getElementById('aiShield').style.width = (this.ai.shield / this.ai.maxShield * 100) + '%';
        document.getElementById('aiShieldText').textContent = Math.max(0, Math.floor(this.ai.shield)) + '/' + this.ai.maxShield;

        // Abilities
        const abilities = ['slash', 'spin', 'shieldAbility', 'ultimate'];
        abilities.forEach((ability, index) => {
            const cooldown = this.player.abilities[ability].cooldown;
            const maxCooldown = this.player.abilities[ability].maxCooldown;
            const percent = (1 - cooldown / maxCooldown) * 100;
            document.getElementById('ability' + (index + 1)).style.width = percent + '%';
        });

        // Combo
        if (this.stats.comboCount > 1) {
            document.getElementById('comboCounter').style.display = 'block';
            document.getElementById('comboCount').textContent = this.stats.comboCount;
        } else {
            document.getElementById('comboCounter').style.display = 'none';
        }

        // Stats
        document.getElementById('damageDealt').textContent = Math.floor(this.stats.damageDealt);
        document.getElementById('damageTaken').textContent = Math.floor(this.stats.damageTaken);
        document.getElementById('kills').textContent = this.stats.kills;

        // Time
        const elapsed = Math.floor((Date.now() - this.gameStartTime) / 1000);
        const minutes = Math.floor(elapsed / 60);
        const seconds = elapsed % 60;
        document.getElementById('gameTime').textContent = minutes + ':' + (seconds < 10 ? '0' : '') + seconds;
    }

    updateEffects() {
        for (let i = this.effects.length - 1; i >= 0; i--) {
            const effect = this.effects[i];
            effect.lifetime--;

            const progress = effect.lifetime / effect.maxLifetime;

            if (effect.initialScale) {
                effect.mesh.scale.setScalar(effect.initialScale * (1 - progress));
            }

            if (effect.velocity) {
                effect.mesh.position.addScaledVector(effect.velocity, 1);
            }

            if (effect.rotation) {
                effect.mesh.rotation.x += effect.rotation.x;
                effect.mesh.rotation.y += effect.rotation.y;
                effect.mesh.rotation.z += effect.rotation.z;
            }

            effect.mesh.material.opacity = progress;

            if (effect.lifetime <= 0) {
                this.scene.remove(effect.mesh);
                this.effects.splice(i, 1);
            }
        }

        for (let i = this.particles.length - 1; i >= 0; i--) {
            const particle = this.particles[i];
            particle.mesh.position.addScaledVector(particle.velocity, 1);
            particle.velocity.y -= 0.01; // gravity
            particle.lifetime--;

            particle.mesh.material.opacity = particle.lifetime / 100;

            if (particle.lifetime <= 0) {
                this.scene.remove(particle.mesh);
                this.particles.splice(i, 1);
            }
        }
    }

    endGame(result) {
        this.gameState = result;
        const statusElement = document.getElementById('statusMessage');

        if (result === 'PLAYER_WIN') {
            statusElement.innerHTML = '✅ VICTORY!<br>You defeated the AI Boss!';
            statusElement.className = 'status-message game-win';
            this.stats.kills++;
        } else {
            statusElement.innerHTML = '❌ DEFEAT!<br>The AI Boss has won!';
            statusElement.className = 'status-message game-over';
        }

        setTimeout(() => {
            statusElement.innerHTML += '<br><br>Press SPACE to restart';
        }, 2000);
    }

    animate() {
        requestAnimationFrame(() => this.animate());

        this.updatePlayer();
        this.updateAI();
        this.updateEffects();
        this.updateUI();

        this.player.group.position.copy(this.player.position);
        this.ai.group.position.copy(this.ai.position);

        this.renderer.render(this.scene, this.camera);
    }

    onWindowResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }
}

// بیست بازی
const game = new Game3D();
