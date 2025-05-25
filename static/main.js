let in_process = false;

window.addEventListener('load', () => {
    changeStems('2');
    const loader = document.getElementById('fullscreen-loader');
    const upload_form = document.getElementById('upload_form');
    
    upload_form.addEventListener('submit', (e) => {
        e.preventDefault();
        
        if (!in_process) {
            in_process = true;
            loader.style.display = 'flex';
            document.body.style.overflow = 'hidden'; // Блокируем скролл
            
            const file = document.querySelector('input[type="file"]').files[0];
            if (file) {
                file.name = file.name.replace(/ /g, '');
                const formData = new FormData(upload_form);
                
                fetch('/upload', {
                    method: 'POST',
                    body: formData
                }).then((response) => {
                    response.json().then((json) => {
                        if (json.success != '') {
                            addLinks(json.stems, json.success.slice(0, -4));
                        }
                        in_process = false;
                        loader.style.display = 'none';
                        document.body.style.overflow = ''; // Возвращаем скролл
                    });
                }).catch((error) => {
                    console.log(error);
                    in_process = false;
                    loader.style.display = 'none';
                    document.body.style.overflow = ''; // Возвращаем скролл
                });
            }
        } else {
            alert('Processing in progress...');
        }
    });

    const choice = document.getElementById('stems');
    choice.addEventListener('change', (e) => {
        changeStems(e.target.value);
    });
    
    const waveformCanvas = document.getElementById("waveformCanvas");
    document.getElementById("file").addEventListener("change", (e) => {
        const inTrack = new TrackDrawer(waveformCanvas, e.target.files[0]);
        document.querySelector('.file-label').textContent = e.target.files[0].name;
    });
});

function changeStems(stems) {
    const elements = document.querySelectorAll('.stems-group');
    elements.forEach(element => {
        element.style.display = 'none';
    });
    const stem = document.getElementById(stems);
    stem.style.display = 'block';
}

function addLinks(stems, filename) {
    const stem = document.getElementById(stems);
    const stemItems = stem.querySelectorAll('.stem-item');
    
    stemItems.forEach(item => {
        item.classList.add('downloadable');
        item.addEventListener("click", function() {
            window.location.href = "/output/" + filename + "/" + item.id + ".wav";
        });
    });
}

class TrackDrawer {
    samples = 100;
    
    constructor(canvas, file) {
        this.canvas = canvas;
        this.file = file;
        this.ctx = this.canvas.getContext('2d');
        
        // Получаем размеры из CSS
        const rect = canvas.getBoundingClientRect();
        const dpr = devicePixelRatio;
        
        // Устанавливаем размер с учетом pixel ratio для четкости
        this.canvas.width = rect.width * dpr;
        this.canvas.height = rect.height * dpr;
        
        // Масштабируем контекст
        this.ctx.scale(dpr, dpr);
        
        this.width = rect.width;
        this.height = rect.height;
        this.fileUpload();
    }
    
    async fileUpload() {
        if (!this.file) return;
    
        const arrayBuffer = await this.file.arrayBuffer();
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const buffer = await audioContext.decodeAudioData(arrayBuffer);
    
        const rawData = buffer.getChannelData(0);
        const blockSize = Math.floor(rawData.length / this.samples);
        this.reducedData = new Float32Array(this.samples);

        this.ctx.clearRect(0, 0, this.width, this.height);

        for (let i = 0; i < this.samples; i++) {
            let sum = 0;
            for (let j = 0; j < blockSize; j++) {
                sum += Math.abs(rawData[i * blockSize + j]);
            }
            this.reducedData[i] = sum / blockSize;
        }
        
        this.speed = 15;
        this.ctx.lineWidth = 2;
        this.ctx.strokeStyle = "#333";
        this.ctx.lineCap = "round";
        
        const max = Math.max(...this.reducedData);
        console.log(`Max value: ${max}`);

        this.render(0, max*1.1);
    }
    
    render(currentIndex, max) {
        if (currentIndex < this.samples) {
            const sample = Math.pow(this.reducedData[currentIndex], 1.6) * this.height/max
            const x = (currentIndex / this.samples) * this.width+2;
            const yMin = this.height / 2 - sample;
            const yMax = this.height / 2 + sample;

            this.ctx.beginPath();
            this.ctx.moveTo(x, yMin);
            this.ctx.lineTo(x, yMax);
            this.ctx.stroke();

            currentIndex++;
            setTimeout(this.render.bind(this, currentIndex, max), this.speed);
        }
    }
}