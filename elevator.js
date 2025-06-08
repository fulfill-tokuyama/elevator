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
const trainRadius = 15; // 電車の走行半径
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
    const groundGeometry = new THREE.PlaneGeometry(250, 250);
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

// 電車の作成
function createTrain() {
    // 電車の本体
    const trainGeometry = new THREE.BoxGeometry(3, 1.5, 1.5);
    const trainMaterial = new THREE.MeshPhongMaterial({ color: 0xE91E63 });
    train = new THREE.Mesh(trainGeometry, trainMaterial);
    
    // 電車の屋根
    const roofGeometry = new THREE.BoxGeometry(3, 0.5, 1.5);
    const roofMaterial = new THREE.MeshPhongMaterial({ color: 0x9C27B0 });
    const roof = new THREE.Mesh(roofGeometry, roofMaterial);
    roof.position.y = 1;
    train.add(roof);

    // 電車の窓
    const windowGeometry = new THREE.BoxGeometry(0.5, 0.5, 0.1);
    const windowMaterial = new THREE.MeshPhongMaterial({ color: 0x81D4FA });
    
    // 左側の窓
    const leftWindow = new THREE.Mesh(windowGeometry, windowMaterial);
    leftWindow.position.set(0, 0.3, 0.8);
    train.add(leftWindow);
    
    // 右側の窓
    const rightWindow = new THREE.Mesh(windowGeometry, windowMaterial);
    rightWindow.position.set(0, 0.3, -0.8);
    train.add(rightWindow);

    // 電車の位置を初期化
    updateTrainPosition();
    scene.add(train);
}

// 電車の位置を更新
function updateTrainPosition() {
    if (!train) return;
    
    // 円運動の計算
    const x = Math.cos(trainAngle) * trainRadius;
    const z = Math.sin(trainAngle) * trainRadius;
    
    train.position.set(x, 1.0, z);
    
    // 電車の向きを進行方向に合わせる
    train.rotation.y = trainAngle + Math.PI / 2;
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
    
    // 電車のアニメーション
    if (train) {
        trainAngle += trainSpeed;
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