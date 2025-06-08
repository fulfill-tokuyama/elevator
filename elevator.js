let scene, camera, renderer, elevator, controls;
let currentFloor = 1;
const floorHeight = 5;
const floors = 10;
let elevatorDoors = [];
let currentCharacter = null;
let characterModel = null;
let doorsOpen = true;
let moving = false;
let train = null;
let trainAngle = 0;
let rail1 = null;
let rail2 = null;
const buildingSize = 8; // 建物の幅
const railGap = 0.7; // レール間隔
const railMargin = 12; // 建物からレールまでの余白を大きく
const railRadius = (buildingSize / 2) + railMargin + (railGap / 2); // レール中心半径
const trainRadius = railRadius; // 電車の走行半径をレールに合わせる
const trainSpeed = 0.005; // 電車の速度

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
    
    // 線路の作成
    createRail();

    // エレベーターの作成
    createElevator();

    // 電車の作成
    createTrain();

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

    // 地面の作成
    const groundGeometry = new THREE.PlaneGeometry(1500, 1500);
    const groundMaterial = new THREE.MeshPhongMaterial({ 
        color: 0x4CAF50,
        side: THREE.DoubleSide
    });
    const ground = new THREE.Mesh(groundGeometry, groundMaterial);
    ground.rotation.x = Math.PI / 2;
    ground.position.y = -0.1;
    scene.add(ground);

    // 各階の床を作成
    for (let i = 0; i < floors; i++) {
        const floorGeometry = new THREE.BoxGeometry(8, 0.2, 8);
        const floorMaterial = new THREE.MeshPhongMaterial({ 
            color: 0x8B4513,
            transparent: true,
            opacity: 0.9
        });
        const floor = new THREE.Mesh(floorGeometry, floorMaterial);
        floor.position.y = i * floorHeight;
        scene.add(floor);
    }
}

// 円状の2本レールを作成
function createRail() {
    const railTube = 0.12;
    const railSegments = 120;
    // 外側レール
    const railGeometry1 = new THREE.TorusGeometry(railRadius + railGap / 2, railTube, 16, railSegments);
    const railMaterial1 = new THREE.MeshPhongMaterial({ color: 0x666666, metalness: 0.8 });
    rail1 = new THREE.Mesh(railGeometry1, railMaterial1);
    rail1.position.y = 0;
    rail1.rotation.x = Math.PI / 2;
    scene.add(rail1);
    // 内側レール
    const railGeometry2 = new THREE.TorusGeometry(railRadius - railGap / 2, railTube, 16, railSegments);
    const railMaterial2 = new THREE.MeshPhongMaterial({ color: 0x666666, metalness: 0.8 });
    rail2 = new THREE.Mesh(railGeometry2, railMaterial2);
    rail2.position.y = 0;
    rail2.rotation.x = Math.PI / 2;
    scene.add(rail2);
}

// エレベーターの作成
function createElevator() {
    // エレベーター本体
    const elevatorGeometry = new THREE.BoxGeometry(3, 4, 3);
    const elevatorMaterial = new THREE.MeshPhongMaterial({ 
        color: 0xff6b6b,
        transparent: true,
        opacity: 0.9
    });
    elevator = new THREE.Mesh(elevatorGeometry, elevatorMaterial);
    elevator.position.y = 2;
    scene.add(elevator);

    // ドアの作成
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

// 阪急電車風の電車を作成
function createTrain() {
    train = new THREE.Group();
    const maroonColor = 0x7B3F00;
    const creamColor = 0xFFF8DC;
    const blackColor = 0x222222;

    // 車体本体（長さ10）
    const bodyGeometry = new THREE.BoxGeometry(10, 2, 1.8);
    const bodyMaterial = new THREE.MeshPhongMaterial({ color: maroonColor, shininess: 100 });
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    body.position.y = 1.1;
    body.castShadow = true;
    body.receiveShadow = true;
    train.add(body);

    // 屋根
    const roofGeometry = new THREE.BoxGeometry(10, 0.3, 2.1);
    const roofMaterial = new THREE.MeshPhongMaterial({ color: 0x999999, metalness: 0.8 });
    const roof = new THREE.Mesh(roofGeometry, roofMaterial);
    roof.position.y = 2.35;
    train.add(roof);

    // 窓のライン
    const windowLineGeometry = new THREE.BoxGeometry(9.5, 0.7, 2.0);
    const windowLineMaterial = new THREE.MeshPhongMaterial({ color: creamColor });
    const windowLine = new THREE.Mesh(windowLineGeometry, windowLineMaterial);
    windowLine.position.y = 1.1;
    train.add(windowLine);

    // 個別の窓
    for (let i = -4; i <= 4; i += 2) {
        if (Math.abs(i) <= 4) {
            const windowGeometry = new THREE.BoxGeometry(1, 0.7, 2.05);
            const windowMaterial = new THREE.MeshPhongMaterial({ color: 0x333333, opacity: 0.7, transparent: true });
            const window = new THREE.Mesh(windowGeometry, windowMaterial);
            window.position.set(i, 1.1, 0);
            train.add(window);
        }
    }

    // 前面（運転席）
    const frontGeometry = new THREE.BoxGeometry(0.2, 2, 1.8);
    const frontMaterial = new THREE.MeshPhongMaterial({ color: maroonColor });
    const front = new THREE.Mesh(frontGeometry, frontMaterial);
    front.position.set(5.1, 1.1, 0);
    train.add(front);

    // 前面窓
    const frontWindowGeometry = new THREE.BoxGeometry(0.3, 1, 1.2);
    const frontWindowMaterial = new THREE.MeshPhongMaterial({ color: 0x222222, opacity: 0.8, transparent: true });
    const frontWindow = new THREE.Mesh(frontWindowGeometry, frontWindowMaterial);
    frontWindow.position.set(5.2, 1.6, 0);
    train.add(frontWindow);

    // ヘッドライト
    const headlightGeometry = new THREE.SphereGeometry(0.15, 16, 16);
    const headlightMaterial = new THREE.MeshPhongMaterial({ color: 0xFFFFAA, emissive: 0xFFFF00, emissiveIntensity: 0.5 });
    const headlight1 = new THREE.Mesh(headlightGeometry, headlightMaterial);
    headlight1.position.set(5.2, 0.8, 0.5);
    train.add(headlight1);
    const headlight2 = new THREE.Mesh(headlightGeometry, headlightMaterial);
    headlight2.position.set(5.2, 0.8, -0.5);
    train.add(headlight2);

    // 台車（ボギー）
    const bogieGeometry = new THREE.BoxGeometry(1.5, 0.25, 1.2);
    const bogieMaterial = new THREE.MeshPhongMaterial({ color: blackColor });
    const bogie1 = new THREE.Mesh(bogieGeometry, bogieMaterial);
    bogie1.position.set(3, 0.15, 0);
    train.add(bogie1);
    const bogie2 = new THREE.Mesh(bogieGeometry, bogieMaterial);
    bogie2.position.set(-3, 0.15, 0);
    train.add(bogie2);

    // 車輪
    const wheelGeometry = new THREE.CylinderGeometry(0.25, 0.25, 0.15, 16);
    const wheelMaterial = new THREE.MeshPhongMaterial({ color: 0x444444, metalness: 0.9 });
    for (let x of [3, -3]) {
        for (let z of [0.5, -0.5]) {
            const wheel = new THREE.Mesh(wheelGeometry, wheelMaterial);
            wheel.rotation.z = Math.PI / 2;
            wheel.position.set(x, 0.3, z);
            train.add(wheel);
        }
    }

    updateTrainPosition();
    scene.add(train);
}

function updateTrainPosition() {
    if (!train) return;
    // 右回り（時計回り）
    const x = Math.cos(trainAngle) * trainRadius;
    const z = Math.sin(trainAngle) * trainRadius;
    const railTube = 0.12; // レールの太さ
    train.position.set(x, railTube, z);
    // 進行方向ベクトル
    const nextAngle = trainAngle - 0.01;
    const nextX = Math.cos(nextAngle) * trainRadius;
    const nextZ = Math.sin(nextAngle) * trainRadius;
    train.lookAt(new THREE.Vector3(nextX, railTube, nextZ));
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
    
    // 電車のアニメーション（右回り）
    if (train) {
        trainAngle -= trainSpeed;
        updateTrainPosition();
    }
    
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