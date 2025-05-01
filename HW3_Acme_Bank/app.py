import os
import sqlite3
from flask import Flask, g, request, jsonify, render_template
from datetime import datetime

BASE_DIR = os.path.dirname(__file__)
DB_DIR   = os.path.join(BASE_DIR, 'db')
DB_PATH  = os.path.join(DB_DIR, 'loans.db')

app = Flask(__name__, static_folder='static', template_folder='templates')

def get_db():
    if 'db' not in g:
        os.makedirs(DB_DIR, exist_ok=True)
        first_time = not os.path.exists(DB_PATH)
        g.db = sqlite3.connect(DB_PATH, detect_types=sqlite3.PARSE_DECLTYPES)
        g.db.row_factory = sqlite3.Row
        if first_time:
            init_schema(g.db)
    return g.db

def init_schema(conn):
    c = conn.cursor()
    c.execute('''
      CREATE TABLE applications (
        app_id  TEXT PRIMARY KEY,
        name    TEXT,
        zipcode TEXT,
        address TEXT,
        status  TEXT
      );
    ''')
    c.execute('''
      CREATE TABLE notes (
        id        INTEGER PRIMARY KEY AUTOINCREMENT,
        app_id    TEXT,
        phase     TEXT,
        message   TEXT,
        timestamp TEXT,
        FOREIGN KEY(app_id) REFERENCES applications(app_id)
      );
    ''')
    conn.commit()

@app.teardown_appcontext
def close_db(exc):
    db = g.pop('db', None)
    if db:
        db.close()

@app.route('/')
def index():
    return render_template('index.html')

# 1) Accept application
@app.route('/api/applications', methods=['POST'])
def create_application():
    data = request.json
    app_id = str(int(datetime.utcnow().timestamp() * 1000))
    db = get_db()
    db.execute('''
      INSERT INTO applications (app_id, name, zipcode, address, status)
      VALUES (?, ?, ?, ?, ?)
    ''', (app_id, data['name'], data['zipcode'], data['address'], 'received'))
    db.execute('''
      INSERT INTO notes (app_id, phase, message, timestamp)
      VALUES (?, ?, ?, ?)
    ''', (app_id, 'submission', 'Application submitted',
          datetime.utcnow().isoformat()))
    db.commit()
    return jsonify({'app_id': app_id})

# 2) Check one application
@app.route('/api/applications/<app_id>', methods=['GET'])
def get_application(app_id):
    db = get_db()
    app_row = db.execute(
      'SELECT * FROM applications WHERE app_id=?', (app_id,)
    ).fetchone()
    if not app_row:
        return jsonify({'error': 'not found'}), 404
    notes = db.execute(
      'SELECT phase, message, timestamp FROM notes WHERE app_id=? ORDER BY id',
      (app_id,)
    ).fetchall()
    return jsonify({
      'app_id':   app_row['app_id'],
      'name':     app_row['name'],
      'zipcode':  app_row['zipcode'],
      'address':  app_row['address'],
      'status':   app_row['status'],
      'notes': [
        {'phase': n['phase'], 'message': n['message'], 'timestamp': n['timestamp']}
        for n in notes
      ]
    })

# 3) List all applications
@app.route('/api/applications', methods=['GET'])
def list_applications():
    db = get_db()
    rows = db.execute(
      'SELECT app_id, name, status FROM applications'
    ).fetchall()
    return jsonify([
      {'app_id': r['app_id'], 'name': r['name'], 'status': r['status']}
      for r in rows
    ])

# 4) Change status / add note
@app.route('/api/applications/<app_id>', methods=['PATCH'])
def update_application(app_id):
    data = request.json
    db = get_db()
    if 'status' in data:
        db.execute(
          'UPDATE applications SET status=? WHERE app_id=?',
          (data['status'], app_id)
        )
    if 'phase' in data and 'message' in data:
        db.execute('''
          INSERT INTO notes (app_id, phase, message, timestamp)
          VALUES (?, ?, ?, ?)
        ''', (app_id, data['phase'], data['message'], datetime.utcnow().isoformat()))
    db.commit()
    return get_application(app_id)

# 5) Clear database
@app.route('/api/applications', methods=['DELETE'])
def clear_database():
    db = get_db()
    db.execute('DELETE FROM notes')
    db.execute('DELETE FROM applications')
    db.commit()
    return '', 204

if __name__ == '__main__':
    app.run(debug=True)
