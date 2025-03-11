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

    const file = document.getElementById('file');
    file.addEventListener('change', (e) => {
        console.log(e.target.files[0].name.slice(0, -4));
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
