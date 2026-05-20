

const defaultImages = [
  "https://picsum.photos/id/1015/300/300",
  "https://picsum.photos/id/1025/300/300",
  "https://picsum.photos/id/1035/300/300",
  "https://picsum.photos/id/1040/300/300"
];



let db;

const request = indexedDB.open("MemoryGameDB", 1);

request.onupgradeneeded = function(event) {

  db = event.target.result;

  if (!db.objectStoreNames.contains("images")) {

    db.createObjectStore("images", {
      keyPath: "id",
      autoIncrement: true
    });

  }

};

request.onsuccess = function(event) {

  db = event.target.result;

  loadSavedImages();

  startGame(defaultImages);

};

request.onerror = function() {

  console.log("Database error");

};



function saveImages() {

  const files = document.getElementById("imageUpload").files;

  if (files.length === 0) {
    alert("Please select images first.");
    return;
  }

  const transaction = db.transaction(["images"], "readwrite");

  const store = transaction.objectStore("images");

  Array.from(files).forEach(file => {

    const reader = new FileReader();

    reader.onload = function(e) {

      store.add({
        name: file.name,
        image: e.target.result
      });

    };

    reader.readAsDataURL(file);

  });

  transaction.oncomplete = function() {

    alert("Images saved!");

    loadSavedImages();

  };

}



function loadSavedImages() {

  const transaction = db.transaction(["images"], "readonly");

  const store = transaction.objectStore("images");

  const request = store.getAll();

  request.onsuccess = function() {

    const gallery = document.getElementById("savedGallery");

    gallery.innerHTML = "";

    const images = request.result;

    images.forEach(item => {

      const div = document.createElement("div");

      div.classList.add("gallery-item");

      div.innerHTML = `
        <img src="${item.image}" alt="${item.name}">

        <input
          type="text"
          id="name-${item.id}"
          value="${item.name}"
        >

        <button onclick="updateImage(${item.id})">
          Rename
        </button>

        <button onclick="deleteImage(${item.id})">
          Delete
        </button>
      `;

      gallery.appendChild(div);

    });

   

    if (images.length >= 4) {

      const customImages = images
        .slice(0, 4)
        .map(item => item.image);

      startGame(customImages);

    }

  };

}

function updateImage(id) {

  const newName = document.getElementById(`name-${id}`).value;

  const transaction = db.transaction(["images"], "readwrite");

  const store = transaction.objectStore("images");

  const request = store.get(id);

  request.onsuccess = function() {

    const data = request.result;

    data.name = newName;

    store.put(data);

    alert("Image renamed!");

  };

}



function deleteImage(id) {

  const transaction = db.transaction(["images"], "readwrite");

  const store = transaction.objectStore("images");

  store.delete(id);

  transaction.oncomplete = function() {

    alert("Image deleted!");

    loadSavedImages();

  };

}


let gameImages = [];

let flippedCards = [];

let matchedPairs = 0;

let moves = 0;

let lockBoard = false;

let timer = 0;

let timerInterval;



function startGame(images) {

  clearInterval(timerInterval);

  timer = 0;

  document.getElementById("timer").innerText = timer;

  timerInterval = setInterval(() => {

    timer++;

    document.getElementById("timer").innerText = timer;

  }, 1000);

  gameImages = [...images, ...images];

  shuffle(gameImages);

  flippedCards = [];

  matchedPairs = 0;

  moves = 0;

  document.getElementById("moves").innerText = moves;

  document.getElementById("matches").innerText = matchedPairs;

  const gameBoard = document.getElementById("gameBoard");

  gameBoard.innerHTML = "";

  gameImages.forEach(image => {

    const card = document.createElement("div");

    card.classList.add("card");

    card.innerHTML = `
      <div class="card-inner">

        <div class="card-front">
          ?
        </div>

        <div class="card-back">
          <img src="${image}">
        </div>

      </div>
    `;

    card.addEventListener("click", () => {

      flipCard(card, image);

    });

    gameBoard.appendChild(card);

  });

}



function flipCard(card, image) {

  if (
    lockBoard ||
    card.classList.contains("flipped") ||
    flippedCards.length === 2
  ) {
    return;
  }

  card.classList.add("flipped");

  flippedCards.push({
    card,
    image
  });

  if (flippedCards.length === 2) {

    moves++;

    document.getElementById("moves").innerText = moves;

    checkMatch();

  }

}

function checkMatch() {

  const first = flippedCards[0];

  const second = flippedCards[1];

  if (first.image === second.image) {

    matchedPairs++;

    document.getElementById("matches").innerText = matchedPairs;

    flippedCards = [];

    if (matchedPairs === gameImages.length / 2) {

      clearInterval(timerInterval);

      setTimeout(() => {

        alert(
          `You won!\n\nMoves: ${moves}\nTime: ${timer} seconds`
        );

      }, 500);

    }

  } else {

    lockBoard = true;

    setTimeout(() => {

      first.card.classList.remove("flipped");

      second.card.classList.remove("flipped");

      flippedCards = [];

      lockBoard = false;

    }, 1000);

  }

}



function restartGame() {

  loadSavedImages();

  startGame(defaultImages);

}



function shuffle(array) {

  for (let i = array.length - 1; i > 0; i--) {

    const j = Math.floor(Math.random() * (i + 1));

    [array[i], array[j]] = [array[j], array[i]];

  }

}


document
  .getElementById("saveBtn")
  .addEventListener("click", saveImages);

document
  .getElementById("restartBtn")
  .addEventListener("click", restartGame);

document
  .getElementById("loadBtn")
  .addEventListener("click", loadSavedImages);