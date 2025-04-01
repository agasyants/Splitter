in_process = false;

window.addEventListener('load', () => {
    changeStems('2');
    const loader = document.getElementById('loader');
    const upload_form = document.getElementById('upload_form');
    upload_form.addEventListener('submit', (e) => {
        e.preventDefault();

        if (!in_process) {
            in_process = true;
            loader.classList.add('anim');
            const file = document.querySelector('input[type="file"]').files[0];
            file.name = file.name.replace(/ /g, '');
            const formData = new FormData(upload_form);
            console.log('fetch')

            fetch('/upload', {
                method: 'POST',
                body: formData
            }).then((response) => {
                response.json().then((json)=>{
                    if (json.success == true)
                        addLinks(json.stems, file.name.slice(0, -4));
                    in_process = false;
                    loader.classList.remove('anim');
                });
            }).catch((error) => {
                console.log(error);
                in_process = false;
                loader.classList.remove('anim');
            });
        } else {
            alert('in process');
        }
    });

    const choice = document.getElementById('stems');
    choice.addEventListener('change', (e) => {
        changeStems(e.target.value);
    });
    const waveformCanvas = document.getElementById("waveformCanvas");
    // waveformCanvas.height = 100;
    // waveformCanvas.width = 200;
    document.getElementById("file").addEventListener("change", (e) => {
        const inTrack = new TrackDrawer(waveformCanvas, e.target.files[0])
    });
})

function changeStems(stems) {
    const elements = document.querySelectorAll('.stems');
    elements.forEach(element => {
        element.style.display = 'none';
    });
    const stem = document.getElementById(stems);
    stem.style.display = 'block';
    console.log(stem);
}

function addLinks(stems, filename){
    console.log(filename);
    const stem = document.getElementById(stems);
    stems = stem.querySelectorAll('div');
    for (let stem of stems) {
        stem.style.cursor = 'pointer';
        stem.style.color = 'red';
        stem.addEventListener("click", function() {
            window.location.href = "/output/" + filename + "/" + stem.id + ".wav";
        });
    }
}

class TrackDrawer {
    samples = 80;
    constructor(canvas, file) {
        this.canvas = canvas;
        this.file = file;
        this.ctx = this.canvas.getContext('2d');
        this.width = canvas.width;
        this.height = canvas.height;
        this.fileUpload();
    }
    async fileUpload() {
        if (!this.file) return;
    
        const arrayBuffer = await this.file.arrayBuffer();
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const buffer = await audioContext.decodeAudioData(arrayBuffer);
    
        const rawData = buffer.getChannelData(0); // Левый канал
        const blockSize = Math.floor(rawData.length / this.samples); // Количество фреймов на каждую точку
        this.reducedData = new Float32Array(this.samples);

        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        for (let i = 0; i < this.samples; i++) {
            let sum = 0;
            for (let j = 0; j < blockSize; j++) {
                sum += Math.abs(rawData[i * blockSize + j]); // Усредняем амплитуду
            }
            this.reducedData[i] = sum / blockSize;
        }
        this.speed = 20;
        this.animationFrameId = null;
        this.ctx.lineWidth = 3;
        this.ctx.strokeStyle = "black";
        this.render(0);
    }
    draw() {
        ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.ctx.beginPath();
        for (let i = 0; i < this.samples; i++) {
            const x = (i / this.samples) * this.width;
            const yMin = this.height / 2 - this.reducedData[i] * (this.height);
            const yMax = this.height / 2 + this.reducedData[i] * (this.height);
            this.ctx.moveTo(x, yMin);
            this.ctx.lineTo(x, yMax);
        }
        this.ctx.closePath();
        this.ctx.stroke();
    }
    render(currentIndex) {
        if (currentIndex < this.samples) {
            const sample = this.reducedData[currentIndex]*this.height*1.5;
            const x = (currentIndex / this.samples) * this.width;
            const yMin = this.height / 2 - sample;
            const yMax = this.height / 2 + sample;

            this.ctx.beginPath();
            this.ctx.moveTo(x, yMin);
            this.ctx.lineTo(x, yMax);
            this.ctx.stroke();

            currentIndex++;
            setTimeout(this.render.bind(this, currentIndex), this.speed);
        }
    }
}