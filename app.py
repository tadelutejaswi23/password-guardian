from flask import Flask, request, jsonify, render_template
from flask_cors import CORS
import zxcvbn
import requests
import hashlib
import os

app = Flask(__name__)
CORS(app)

@app.route('/')
def home():
    return render_template('index.html')

@app.route('/strength', methods=['POST'])
def check_strength():
    data = request.get_json()
    password = data.get('password', '')
    result = zxcvbn.zxcvbn(password)
    return jsonify({
        'score': result['score'],
        'entropy': result['guesses_log10'] * 3.321928,
        'feedback': result['feedback']['suggestions']
    })

@app.route('/breach', methods=['POST'])
def check_breach():
    data = request.get_json()
    password = data.get('password', '')
    sha1_hash = hashlib.sha1(password.encode()).hexdigest().upper()
    prefix, suffix = sha1_hash[:5], sha1_hash[5:]
    url = f'https://api.pwnedpasswords.com/range/{prefix}'
    response = requests.get(url)
    if response.status_code != 200:
        return jsonify({'breached': False, 'count': 0})
    hashes = (line.split(':') for line in response.text.splitlines())
    for h, count in hashes:
        if h == suffix:
            return jsonify({'breached': True, 'count': int(count)})
    return jsonify({'breached': False, 'count': 0})

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port)