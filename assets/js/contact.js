function submitData() {
    let name = document.getElementById("inputName").value;
    let email = document.getElementById("inputEmail").value;
    let phone = document.getElementById("inputPhoneNumber").value;
    let subject = document.getElementById("inputSubject").value;
    let message = document.getElementById("inputMessage").value;

    if (name == "") {
        return alert("Nama Wajib Diisi!!!");
    } else if (email == "") {
        return alert("Email Wajib Diisi!!!");
    } else if (phone == "") {
        return alert("Phone Wajib Diisi!!!");
    } else if (subject == "") {
        return alert("Subject Wajib Diisi!!!");
    } else if (message == "") {
        return alert("Pesan Wajib Diisi!!!");
    }

    console.log(name);
    console.log(email);
    console.log(phone);
    console.log(subject);
    console.log(message);

    let emailReceiver = "akbarhilal169@gmail.com";
    let a = document.createElement("a");

    a.href = `mailto:${emailReceiver}?subject=${subject}&body=Hallo nama saya ${name}. ${message}. Silahkan menghubungi saya dengan nomor ${phone} atau email ${email}`;

    a.click();

    let dataObject = {
        name,
        email,
        phone,
        subject,
        message,
    };

    console.log(dataObject);
}
