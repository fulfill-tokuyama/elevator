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
    // 建物のサイズをエレベーターに合わせて大きくする
    const buildingWidth = 12;
    const buildingHeight = floorHeight * floors + 2;
    const buildingDepth = 12;
    const buildingGeometry = new THREE.BoxGeometry(buildingWidth, buildingHeight, buildingDepth);
    const buildingMaterial = new THREE.MeshPhongMaterial({ 
        color: 0xcccccc,
        transparent: true,
        opacity: 0.8
    });
    const building = new THREE.Mesh(buildingGeometry, buildingMaterial);
    building.position.y = buildingHeight / 2 - 1;
    scene.add(building);

    // 各階の床を作成
    for (let i = 0; i < floors; i++) {
        const floorGeometry = new THREE.BoxGeometry(buildingWidth, 0.2, buildingDepth);
        const floorMaterial = new THREE.MeshPhongMaterial({ color: 0x8B4513 });
        const floor = new THREE.Mesh(floorGeometry, floorMaterial);
        floor.position.y = i * floorHeight;
        scene.add(floor);
    }

    // --- 建物外の地面を追加 ---
    const groundGeometry = new THREE.BoxGeometry(40, 0.5, 40);
    const groundMaterial = new THREE.MeshPhongMaterial({ color: 0x55aa55 }); // 緑色
    const ground = new THREE.Mesh(groundGeometry, groundMaterial);
    ground.position.y = -0.25; // 地上レベル
    scene.add(ground);
}

// エレベーターの作成
function createElevator() {
    // エレベーター本体（さらに大きくする）
    const elevatorWidth = 8.0;
    const elevatorHeight = 10.0;
    const elevatorDepth = 8.0;
    const elevatorGeometry = new THREE.BoxGeometry(elevatorWidth, elevatorHeight, elevatorDepth);
    const elevatorMaterial = new THREE.MeshPhongMaterial({ 
        color: 0xffffff,
        transparent: true,
        opacity: 0.0 // 完全透明
    });
    elevator = new THREE.Mesh(elevatorGeometry, elevatorMaterial);
    elevator.position.y = elevatorHeight / 2 - 0.5;
    scene.add(elevator);

    // --- 内部の壁（木目調色） ---
    const wallColor = 0xdeb887; // 木目調
    const wallMaterial = new THREE.MeshPhongMaterial({ color: wallColor });
    // 後ろ壁
    const backWall = new THREE.Mesh(new THREE.BoxGeometry(elevatorWidth, elevatorHeight, 0.05), wallMaterial);
    backWall.position.set(0, 0, -elevatorDepth/2 + 0.025);
    elevator.add(backWall);
    // 左壁
    const leftWall = new THREE.Mesh(new THREE.BoxGeometry(0.05, elevatorHeight, elevatorDepth), wallMaterial);
    leftWall.position.set(-elevatorWidth/2 + 0.025, 0, 0);
    elevator.add(leftWall);
    // 右壁
    const rightWall = new THREE.Mesh(new THREE.BoxGeometry(0.05, elevatorHeight, elevatorDepth), wallMaterial);
    rightWall.position.set(elevatorWidth/2 - 0.025, 0, 0);
    elevator.add(rightWall);

    // --- 鏡（後ろ壁の中央下部） ---
    const mirrorMaterial = new THREE.MeshPhongMaterial({ color: 0xbbbbbb, shininess: 100, specular: 0xffffff, transparent: true, opacity: 0.7 });
    const mirror = new THREE.Mesh(new THREE.BoxGeometry(2.5, 6.5, 0.03), mirrorMaterial);
    mirror.position.set(0, -1.0, -elevatorDepth/2 + 0.04);
    elevator.add(mirror);

    // --- 天井（明るい白） ---
    const ceilingMaterial = new THREE.MeshPhongMaterial({ color: 0xffffff, emissive: 0xffffff, emissiveIntensity: 0.7 });
    const ceiling = new THREE.Mesh(new THREE.BoxGeometry(elevatorWidth-0.1, 0.08, elevatorDepth-0.1), ceilingMaterial);
    ceiling.position.set(0, elevatorHeight/2 - 0.04, 0);
    elevator.add(ceiling);

    // --- 床（タイル風の明るいグレー） ---
    const floorMaterial = new THREE.MeshPhongMaterial({ color: 0xe0e0e0 });
    const floor = new THREE.Mesh(new THREE.BoxGeometry(elevatorWidth-0.1, 0.08, elevatorDepth-0.1), floorMaterial);
    floor.position.set(0, -elevatorHeight/2 + 0.04, 0);
    elevator.add(floor);

    // --- 手すり（右壁に円柱） ---
    const railMaterial = new THREE.MeshPhongMaterial({ color: 0x888888, shininess: 80 });
    const rail = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 5.5, 32), railMaterial);
    rail.position.set(elevatorWidth/2 - 0.18, -2.5, 2.0);
    rail.rotation.z = Math.PI / 2;
    elevator.add(rail);

    // --- 操作パネル（右壁に画像を貼る・大きく自然に表示） ---
    const textureLoader = new THREE.TextureLoader();
    textureLoader.load(
        '/操作パネル.png',
        function(panelTexture) {
            const panelGeo = new THREE.PlaneGeometry(2.2, 5.0);
            const panelMat = new THREE.MeshBasicMaterial({ map: panelTexture, transparent: true });
            const panelMesh = new THREE.Mesh(panelGeo, panelMat);
            panelMesh.position.set(elevatorWidth/2 - 0.03, 0.8, 2.2);
            panelMesh.rotation.y = -Math.PI/2;
            elevator.add(panelMesh);
        },
        undefined,
        function(err) {
            // 読み込み失敗時は何もしない
        }
    );

    // --- ドアの作成（前面） ---
    // 扉の幅をエレベーター幅の半分にし、開閉範囲も調整
    const doorWidth = elevatorWidth / 2;
    const doorHeight = elevatorHeight * 0.85;
    const doorGeometry = new THREE.BoxGeometry(doorWidth, doorHeight, 0.1);
    const doorMaterial = new THREE.MeshPhongMaterial({ color: 0xffffff });
    // 左ドア
    const leftDoor = new THREE.Mesh(doorGeometry, doorMaterial);
    leftDoor.position.set(-doorWidth / 2, 0, elevatorDepth/2 - 0.05);
    elevator.add(leftDoor);
    elevatorDoors.push(leftDoor);
    // 右ドア
    const rightDoor = new THREE.Mesh(doorGeometry, doorMaterial);
    rightDoor.position.set(doorWidth / 2, 0, elevatorDepth/2 - 0.05);
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
    // 開くときは左右にエレベーター幅の1/2ずつ動かす
    const openOffset = elevatorWidth / 2 - (elevatorWidth / 4);
    const targetPositions = isOpening ? [-openOffset, openOffset] : [-(elevatorWidth / 4), (elevatorWidth / 4)];

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
                const geometry = new THREE.PlaneGeometry(1.8, 1.8);
                const material = new THREE.MeshBasicMaterial({ map: texture, transparent: true });
                characterModel = new THREE.Mesh(geometry, material);
                characterModel.position.set(0, -2.5, 2.7);
                characterModel.rotation.y = Math.PI;
                elevator.add(characterModel);
            },
            undefined,
            function(err) {
                // エラー時は何も表示しない
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