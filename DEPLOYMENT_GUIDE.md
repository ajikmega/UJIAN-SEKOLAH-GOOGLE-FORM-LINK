# Panduan Deployment Exambit ke cPanel Sekolah

## 1. Persiapan Sebelum Deploy

### 1.1 Informasi yang Diperlukan
- **URL Subdomain**: misalnya `https://sekolah.sch.id/exambit`
- **Direktori cPanel**: path ke folder exambit di server sekolah
- **Database Credentials**:
  - Database name
  - Database username
  - Database password
  - Database host
- **Gemini API Key**: dari Google Cloud Console
- **FTP/SFTP Credentials**: untuk upload files

### 1.2 Konfigurasi Environment
Buat file `.env` di root project dengan konten:

```env
GEMINI_API_KEY=your_actual_gemini_key
API_BASE_URL=https://sekolah.sch.id/api
```

## 2. Build Production

Jalankan perintah berikut untuk build:

```bash
npm run build
```

Output akan ada di folder `dist/`. Folder ini yang akan diupload ke cPanel.

## 3. Setup Backend PHP di cPanel

Backend PHP perlu dibuat di server sekolah. Struktur folder yang direkomendasikan:

```
public_html/
├── exambit/                    (folder frontend - hasil build)
│   ├── index.html
│   ├── assets/
│   └── .htaccess
└── api/                        (folder backend PHP - perlu dibuat)
    ├── config.php
    ├── auth.php
    ├── classes.php
    ├── questions.php
    ├── packages.php
    ├── exams.php
    ├── results.php
    ├── analytics.php
    ├── sync_results.php
    └── system.php
```

### 3.1 Template Database Connection (config.php)

```php
<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    http_response_code(200);
    exit();
}

$db_host = 'localhost';
$db_name = 'nama_database_sekolah';
$db_user = 'username_database';
$db_pass = 'password_database';

try {
    $conn = new mysqli($db_host, $db_user, $db_pass, $db_name);
    if ($conn->connect_error) {
        throw new Exception("Connection failed: " . $conn->connect_error);
    }
    $conn->set_charset("utf8mb4");
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => $e->getMessage()]);
    exit();
}
?>
```

### 3.2 Contoh File API (auth.php)

```php
<?php
require 'config.php';

$action = $_GET['action'] ?? $_POST['action'] ?? '';
$input = json_decode(file_get_contents('php://input'), true);

if ($action === 'login') {
    $identifier = $input['identifier'] ?? '';
    $credential = $input['credential'] ?? '';
    $role = $input['role'] ?? '';

    if ($role === 'ADMIN') {
        // Implement admin login logic
        // Query dari database untuk validasi admin
        $response = [
            'data' => [
                'id' => 'admin-1',
                'username' => $identifier,
                'role' => 'ADMIN',
                'fullName' => 'Administrator'
            ]
        ];
    } else {
        // Implement student login logic
        $response = [
            'data' => [
                'id' => uniqid(),
                'username' => str_replace(' ', '', strtolower($identifier)),
                'role' => 'STUDENT',
                'fullName' => $identifier,
                'className' => $credential
            ]
        ];
    }

    echo json_encode($response);
} else {
    http_response_code(400);
    echo json_encode(['error' => 'Action not found']);
}
?>
```

## 4. Upload ke cPanel

### 4.1 Menggunakan FTP/SFTP
1. Buka FTP/SFTP client (FileZilla, WinSCP, dll)
2. Connect ke server sekolah dengan credentials yang diberikan
3. Navigate ke folder `public_html`
4. Buat folder baru bernama `exambit`
5. Upload semua files dari folder `dist/` ke folder `exambit`
6. Upload folder `api/` (dengan files PHP) ke `public_html` (di samping folder exambit)

### 4.2 Menggunakan cPanel File Manager
1. Login ke cPanel sekolah
2. Buka File Manager
3. Navigate ke `public_html`
4. Buat folder `exambit`
5. Upload `dist` folder ke `exambit`
6. Upload files API ke folder `api`

## 5. Konfigurasi di Server

### 5.1 .htaccess
File `.htaccess` sudah disertakan di project. Pastikan file ini di-upload ke folder `public_html/exambit/`.

Konten .htaccess:
```apache
<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase /exambit/
  RewriteCond %{REQUEST_FILENAME} !-f
  RewriteCond %{REQUEST_FILENAME} !-d
  RewriteRule ^ index.html [L]
</IfModule>
```

### 5.2 Izin File di cPanel
1. Folder: izin `755`
2. File: izin `644`

Dapat diatur melalui cPanel File Manager:
- Right-click file → Change Permissions
- Set to `644` untuk files, `755` untuk folders

## 6. Database Setup

### 6.1 Buat Database
1. Login ke cPanel
2. Buka "MySQL Databases"
3. Buat database baru dengan nama: `school_exambit`
4. Buat user baru dengan nama: `exambit_user`
5. Set password yang kuat
6. Assign user ke database dengan semua privileges

### 6.2 Import Schema
Buat dan jalankan SQL script berikut di phpMyAdmin:

```sql
CREATE TABLE classes (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE questions (
    id VARCHAR(50) PRIMARY KEY,
    packageId VARCHAR(50),
    text TEXT NOT NULL,
    type VARCHAR(20),
    options JSON,
    correctAnswer VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE packages (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    questionCount INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE exams (
    id VARCHAR(50) PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    packageId VARCHAR(50),
    assignedClasses JSON,
    timeLimit INT,
    dueDate DATETIME,
    isActive BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE exam_results (
    id VARCHAR(50) PRIMARY KEY,
    examId VARCHAR(50),
    studentName VARCHAR(100),
    className VARCHAR(50),
    score INT,
    status VARCHAR(20),
    completedAt DATETIME,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_exam_id ON exam_results(examId);
CREATE INDEX idx_student_name ON exam_results(studentName);
```

## 7. Testing

### 7.1 Test Frontend
1. Buka browser dan navigasi ke `https://sekolah.sch.id/exambit`
2. Test login page
3. Verify navigation bekerja
4. Check browser console untuk errors

### 7.2 Test Backend Connection
1. Buka browser developer tools (F12)
2. Buka Network tab
3. Login dan verifikasi API calls berjalan
4. Check response status 200 untuk successful calls

### 7.3 Test Database
1. Login ke phpMyAdmin
2. Verify data tersimpan di database
3. Check exam results tersimpan dengan benar

## 8. Troubleshooting

### Error: "Cannot find module"
- Verify semua files di-upload dengan benar
- Check folder structure di cPanel

### Error: "API connection failed"
- Verify `API_BASE_URL` di `.env` sudah benar
- Check PHP backend files sudah di-upload
- Verify database credentials di `config.php`

### Error: "CORS error"
- Verify headers di PHP files sudah set:
  ```php
  header('Access-Control-Allow-Origin: *');
  header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
  header('Access-Control-Allow-Headers: Content-Type');
  ```

### White page / 404 error
- Verify `.htaccess` file sudah di-upload ke folder `exambit`
- Check mod_rewrite di-enable di cPanel
- Contact IT sekolah untuk enable `AllowOverride All`

## 9. Maintenance

### 9.1 Backup Database
1. Login ke cPanel
2. Buka "Backup"
3. Atau gunakan phpMyAdmin untuk export database secara berkala

### 9.2 Update Files
Jika ada update untuk aplikasi:
1. Edit files di local development
2. Run `npm run build`
3. Upload folder `dist` baru ke cPanel
4. Clear browser cache (Ctrl+Shift+Delete)

### 9.3 Monitor Performance
- Check error logs di cPanel: `Home > Metrics > Error Log`
- Monitor database size di phpMyAdmin
- Setup cron job untuk backup otomatis

## 10. Support & Documentation

- **Gemini API Issues**: https://ai.google.dev/
- **cPanel Help**: Contact IT sekolah
- **Database Issues**: Contact Database Administrator
- **Frontend Issues**: Check browser console logs

---

**Status**: Ready for Deployment
**Last Updated**: 2024
**Aplikasi**: Exambit - Online Exam Platform
