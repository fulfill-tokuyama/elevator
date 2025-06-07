let scene, camera, renderer, elevator, controls;
let currentFloor = 1;
const floorHeight = 5;
const floors = 10;
let elevatorDoors = [];
let currentCharacter = null;
let characterModel = null;
let doorsOpen = true;
let moving = false;

// シーンの初期化
function init() {
    // シーンの作成
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x87CEEB); // 空色の背景

    // カメラの設定
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, 5, 10);
    camera.lookAt(0, 0, 0);

    // レンダラーの設定
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);

    // カメラコントロールの設定
    controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;

    // ライトの追加
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(10, 20, 10);
    scene.add(directionalLight);

    // 建物の作成
    createBuilding();
    
    // エレベーターの作成
    createElevator();

    // デフォルトのキャラクターを設定
    changeCharacter('panda');

    // アニメーション開始
    animate();
}

// 建物の作成
function createBuilding() {
    const buildingGeometry = new THREE.BoxGeometry(8, floorHeight * floors, 8);
    const buildingMaterial = new THREE.MeshPhongMaterial({ 
        color: 0xcccccc,
        transparent: true,
        opacity: 0.8
    });
    const building = new THREE.Mesh(buildingGeometry, buildingMaterial);
    building.position.y = (floorHeight * floors) / 2;
    scene.add(building);

    // 各階の床を作成
    for (let i = 0; i < floors; i++) {
        const floorGeometry = new THREE.BoxGeometry(8, 0.2, 8);
        const floorMaterial = new THREE.MeshPhongMaterial({ color: 0x8B4513 });
        const floor = new THREE.Mesh(floorGeometry, floorMaterial);
        floor.position.y = i * floorHeight;
        scene.add(floor);
    }
}

// エレベーターの作成
function createElevator() {
    // エレベーター本体（透明にして内部を見やすくする）
    const elevatorGeometry = new THREE.BoxGeometry(3, 4, 3);
    const elevatorMaterial = new THREE.MeshPhongMaterial({ 
        color: 0xffffff,
        transparent: true,
        opacity: 0.0 // 完全透明
    });
    elevator = new THREE.Mesh(elevatorGeometry, elevatorMaterial);
    elevator.position.y = 2;
    scene.add(elevator);

    // --- 内部の壁（木目調色） ---
    const wallColor = 0xdeb887; // 木目調
    const wallMaterial = new THREE.MeshPhongMaterial({ color: wallColor });
    // 後ろ壁
    const backWall = new THREE.Mesh(new THREE.BoxGeometry(3, 4, 0.05), wallMaterial);
    backWall.position.set(0, 0, -1.475);
    elevator.add(backWall);
    // 左壁
    const leftWall = new THREE.Mesh(new THREE.BoxGeometry(0.05, 4, 3), wallMaterial);
    leftWall.position.set(-1.475, 0, 0);
    elevator.add(leftWall);
    // 右壁
    const rightWall = new THREE.Mesh(new THREE.BoxGeometry(0.05, 4, 3), wallMaterial);
    rightWall.position.set(1.475, 0, 0);
    elevator.add(rightWall);

    // --- 鏡（後ろ壁の中央下部） ---
    const mirrorMaterial = new THREE.MeshPhongMaterial({ color: 0xbbbbbb, shininess: 100, specular: 0xffffff, transparent: true, opacity: 0.7 });
    const mirror = new THREE.Mesh(new THREE.BoxGeometry(1, 2.5, 0.03), mirrorMaterial);
    mirror.position.set(0, -0.25, -1.45);
    elevator.add(mirror);

    // --- 天井（明るい白） ---
    const ceilingMaterial = new THREE.MeshPhongMaterial({ color: 0xffffff, emissive: 0xffffff, emissiveIntensity: 0.7 });
    const ceiling = new THREE.Mesh(new THREE.BoxGeometry(2.95, 0.08, 2.95), ceilingMaterial);
    ceiling.position.set(0, 2, 0);
    elevator.add(ceiling);

    // --- 床（タイル風の明るいグレー） ---
    const floorMaterial = new THREE.MeshPhongMaterial({ color: 0xe0e0e0 });
    const floor = new THREE.Mesh(new THREE.BoxGeometry(2.95, 0.08, 2.95), floorMaterial);
    floor.position.set(0, -2, 0);
    elevator.add(floor);

    // --- 手すり（右壁に円柱） ---
    const railMaterial = new THREE.MeshPhongMaterial({ color: 0x888888, shininess: 80 });
    const rail = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 1.8, 16), railMaterial);
    rail.position.set(1.35, -1, 0.7);
    rail.rotation.z = Math.PI / 2;
    elevator.add(rail);

    // --- 操作パネル（右壁にパネル＋ボタン） ---
    const panelMaterial = new THREE.MeshPhongMaterial({ color: 0x333333 });
    const panel = new THREE.Mesh(new THREE.BoxGeometry(0.5, 1.2, 0.05), panelMaterial);
    panel.position.set(1.48, 0.2, 0.3);
    elevator.add(panel);
    // ボタン（円）
    for (let i = 0; i < 10; i++) {
        const btnMat = new THREE.MeshPhongMaterial({ color: 0xffd700 });
        const btn = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.045, 0.03, 24), btnMat);
        btn.position.set(1.51, 0.7 - (i * 0.13), 0.32);
        btn.rotation.x = Math.PI / 2;
        elevator.add(btn);
    }
    // ディスプレイ（上部に四角）
    const dispMat = new THREE.MeshPhongMaterial({ color: 0x111111, emissive: 0xffa500, emissiveIntensity: 0.3 });
    const disp = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.12, 0.03), dispMat);
    disp.position.set(1.51, 0.85, 0.32);
    elevator.add(disp);

    // --- ドアの作成（前面） ---
    const doorGeometry = new THREE.BoxGeometry(1.4, 3.5, 0.1);
    const doorMaterial = new THREE.MeshPhongMaterial({ color: 0xffffff });
    // 左ドア
    const leftDoor = new THREE.Mesh(doorGeometry, doorMaterial);
    leftDoor.position.set(-0.7, 0, 1.5);
    elevator.add(leftDoor);
    elevatorDoors.push(leftDoor);
    // 右ドア
    const rightDoor = new THREE.Mesh(doorGeometry, doorMaterial);
    rightDoor.position.set(0.7, 0, 1.5);
    elevator.add(rightDoor);
    elevatorDoors.push(rightDoor);
}

// ドアの開閉アニメーション
function animateDoors(isOpening) {
    if ((isOpening && doorsOpen) || (!isOpening && !doorsOpen)) return;
    doorsOpen = isOpening;
    const duration = 1000;
    const startTime = Date.now();
    const startPositions = elevatorDoors.map(door => door.position.x);
    const targetPositions = isOpening ? [-1.5, 1.5] : [-0.7, 0.7];

    function animate() {
        const currentTime = Date.now();
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);

        elevatorDoors.forEach((door, index) => {
            door.position.x = startPositions[index] + (targetPositions[index] - startPositions[index]) * progress;
        });

        if (progress < 1) {
            requestAnimationFrame(animate);
        }
    }

    animate();
}

// ドアを開ける
function openDoors() {
    animateDoors(true);
}
// ドアを閉める
function closeDoors() {
    animateDoors(false);
}

// エレベーターの移動
function moveToFloor(floor) {
    if (floor < 1 || floor > floors || moving) return;
    moving = true;
    // ドアを閉める
    animateDoors(false);
    // ボタンの選択状態を更新
    updateFloorButtonSelection(floor);
    setTimeout(() => {
        const targetY = (floor - 1) * floorHeight + 2;
        const duration = 2000;
        const startY = elevator.position.y;
        const startTime = Date.now();

        function animateElevator() {
            const currentTime = Date.now();
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const easeProgress = progress < 0.5
                ? 4 * progress * progress * progress
                : 1 - Math.pow(-2 * progress + 2, 3) / 2;
            elevator.position.y = startY + (targetY - startY) * easeProgress;
            if (progress < 1) {
                requestAnimationFrame(animateElevator);
            } else {
                // 移動完了後にドアを開ける
                animateDoors(true);
                currentFloor = floor;
                moving = false;
            }
        }
        animateElevator();
    }, 1000);
}

// 階数ボタンの選択状態を更新
function updateFloorButtonSelection(floor) {
    const buttons = document.querySelectorAll('.floor-button');
    buttons.forEach(btn => btn.classList.remove('selected'));
    if (buttons[floor - 1]) {
        buttons[floor - 1].classList.add('selected');
    }
}

// キャラクターの変更
function changeCharacter(type) {
    if (characterModel) {
        elevator.remove(characterModel);
        characterModel = null;
    }

    let imageFile = null;
    if (type === 'panda') imageFile = '/panda.png';
    if (type === 'rabbit') imageFile = '/usagi.png';
    if (type === 'cat') imageFile = '/cat.png';

    if (imageFile) {
        const textureLoader = new THREE.TextureLoader();
        textureLoader.load(
            imageFile,
            function(texture) {
                const geometry = new THREE.PlaneGeometry(1.2, 1.2);
                const material = new THREE.MeshBasicMaterial({ map: texture, transparent: true });
                characterModel = new THREE.Mesh(geometry, material);
                characterModel.position.set(0, 0, 1.1);
                characterModel.rotation.y = Math.PI;
                elevator.add(characterModel);
            },
            undefined,
            function(err) {
                alert('画像の読み込みに失敗しました: ' + imageFile);
            }
        );
    }
    currentCharacter = type;
}

// カメラビューの変更
function changeCameraView(view) {
    switch(view) {
        case 'front':
            camera.position.set(0, 5, 10);
            break;
        case 'side':
            camera.position.set(10, 5, 0);
            break;
        case 'top':
            camera.position.set(0, 15, 0);
            break;
    }
    camera.lookAt(0, 0, 0);
}

// アニメーションループ
function animate() {
    requestAnimationFrame(animate);
    controls.update();
    renderer.render(scene, camera);
}

// ウィンドウリサイズ対応
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

// 初期化
init(); 