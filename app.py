from flask import Flask, render_template, request, send_from_directory
import os

app = Flask(__name__)
app.config['UPLOAD_FOLDER'] = 'uploads'

@app.route('/', methods=['GET'])
def index():
    return render_template('index.html')
 
@app.route('/upload', methods=['POST'])
def upload():
    if request.method == 'POST':
        file = request.files['file']
        file.filename = file.filename.replace(' ', '').replace(".", str(len(os.listdir("uploads")))+".")
        file.save(os.path.join('uploads', file.filename))
        print('going')
        os.system('spleeter separate -p spleeter:' + request.form['choice'] + 'stems -o output '+ os.path.join('uploads', file.filename))
        os.remove(os.path.join('uploads', file.filename))
        return {'success': file.filename, 'stems': request.form['choice']}
    return {'success': '', 'stems': 0}

@app.route('/output/<directory>/<name>')
def download_file(directory, name):
    return send_from_directory('output/'+ directory, name, as_attachment=True)

if __name__ == '__main__':
    app.run(debug=True)