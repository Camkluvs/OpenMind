<?php
// contact.php - Sistema de procesamiento de formularios
header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Método no permitido']);
    exit;
}

// Configuración
$admin_email = "hola@openmind.com";
$support_email = "soporte@openmind.com";
$sales_email = "ventas@openmind.com";

// Validar y sanitizar datos
$firstName = filter_var($_POST['firstName'] ?? '', FILTER_SANITIZE_STRING);
$lastName = filter_var($_POST['lastName'] ?? '', FILTER_SANITIZE_STRING);
$email = filter_var($_POST['email'] ?? '', FILTER_SANITIZE_EMAIL);
$phone = filter_var($_POST['phone'] ?? '', FILTER_SANITIZE_STRING);
$department = filter_var($_POST['department'] ?? '', FILTER_SANITIZE_STRING);
$subject = filter_var($_POST['subject'] ?? '', FILTER_SANITIZE_STRING);
$message = filter_var($_POST['message'] ?? '', FILTER_SANITIZE_STRING);
$newsletter = isset($_POST['newsletter']);

// Validaciones
if (empty($firstName) || empty($lastName) || empty($email) || empty($subject) || empty($message)) {
    echo json_encode(['success' => false, 'message' => 'Por favor completa todos los campos obligatorios']);
    exit;
}

if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    echo json_encode(['success' => false, 'message' => 'El correo electrónico no es válido']);
    exit;
}

// Determinar email de destino según departamento
$to_email = $admin_email;
switch ($department) {
    case 'soporte':
        $to_email = $support_email;
        break;
    case 'ventas':
        $to_email = $sales_email;
        break;
    case 'colaboraciones':
        $to_email = $admin_email;
        break;
    default:
        $to_email = $admin_email;
}

// Preparar el email
$email_subject = "Nuevo mensaje de contacto: " . $subject;
$email_body = "
Nuevo mensaje de contacto desde OpenMind AI:

Nombre: $firstName $lastName
Email: $email
Teléfono: " . ($phone ?: 'No proporcionado') . "
Departamento: " . ucfirst($department) . "
Asunto: $subject

Mensaje:
$message

" . ($newsletter ? "El usuario desea recibir newsletter" : "");

$headers = "From: $email\r\n";
$headers .= "Reply-To: $email\r\n";
$headers .= "Content-Type: text/plain; charset=UTF-8\r\n";

// Enviar email
if (mail($to_email, $email_subject, $email_body, $headers)) {
    // Guardar en base de datos (opcional)
    saveToDatabase($firstName, $lastName, $email, $phone, $department, $subject, $message, $newsletter);
    
    echo json_encode(['success' => true, 'message' => 'Mensaje enviado correctamente. Te contactaremos pronto.']);
} else {
    echo json_encode(['success' => false, 'message' => 'Error al enviar el mensaje. Por favor intenta nuevamente.']);
}

function saveToDatabase($firstName, $lastName, $email, $phone, $department, $subject, $message, $newsletter) {
    // Aquí puedes guardar en MySQL, SQLite, etc.
    $data = [
        'firstName' => $firstName,
        'lastName' => $lastName,
        'email' => $email,
        'phone' => $phone,
        'department' => $department,
        'subject' => $subject,
        'message' => $message,
        'newsletter' => $newsletter,
        'timestamp' => date('Y-m-d H:i:s'),
        'ip' => $_SERVER['REMOTE_ADDR']
    ];
    
    // Guardar en archivo JSON (temporal)
    file_put_contents('contact_submissions.json', 
        json_encode($data, JSON_PRETTY_PRINT) . ",\n", 
        FILE_APPEND | LOCK_EX
    );
}
?>