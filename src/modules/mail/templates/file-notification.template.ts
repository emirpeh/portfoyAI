interface FileNotificationContext {
  file: {
    id: number;
    pozNo: string;
    DosyaAdi: string;
    customer: string;
    sender: string;
    receiver: string;
    tarih: Date;
    aciklama: string;
    firma: string;
    yol: string;
    Tip: string;
    belge: string;
    ftpyol: string;
  };
  baseUrl: string;
}

export const generateFileNotificationTemplate = (
  context: FileNotificationContext,
): string => {
  const { file, baseUrl } = context;

  return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Yeni Dosya Bildirimi / New File Notification</title>
    <style>
        body { 
            font-family: Arial, sans-serif; 
            line-height: 1.6; 
            color: #ffffff; 
            margin: 0; 
            padding: 0; 
            background-color: #333333;
        }
        .container { 
            max-width: 600px; 
            margin: 0 auto; 
        }
        .header { 
            background-color: #FFD93D; /* Yellow header */
            padding: 20px; 
            text-align: center; 
        }
        .logo {
            max-width: 150px;
            height: auto;
            margin-bottom: 10px;
        }
        .header h2 { 
            color: #333333; /* Dark text */
            margin: 10px 0; 
            font-size: 22px;
            font-weight: bold;
        }
        .content { 
            padding: 20px; 
            background-color: #4F4F4F; /* Dark gray background */
        }
        .notification-box { 
            background-color: #333333; /* Darker gray background */
            padding: 10px; 
            margin: 10px 0; 
            color: #ffffff;
            border-left: 4px solid #FFD93D; /* Yellow border */
        }
        .info-table { 
            width: 100%; 
            margin-top: 10px; 
            border-collapse: collapse;
        }
        .info-table td { 
            padding: 8px; 
            border: 1px solid #333333;
            color: #ffffff;
            background-color: #4F4F4F; /* Dark gray */
        }
        .info-table td:first-child { 
            font-weight: bold; 
            width: 35%; 
            background-color: #333333; /* Darker gray */
        }
        .info-badge {
            display: inline-block;
            padding: 2px 6px;
            background-color: #FFD93D; /* Yellow badge */
            border-radius: 4px;
            font-size: 11px;
            color: #333333;
            margin-left: 5px;
            font-weight: bold;
        }
        .file-link {
            text-align: center;
            margin-top: 20px;
            background-color: #333333; /* Darker gray background */
            padding: 10px;
        }
        .file-link p {
            margin-bottom: 5px;
            font-weight: bold;
            color: #ffffff;
        }
        .file-link a {
            color: #FFD93D; /* Yellow link */
            word-break: break-all;
        }
        .contact-info {
            background-color: #333333; /* Darker gray background */
            padding: 10px;
            margin-top: 20px;
            text-align: center;
        }
        .contact-info p {
            margin: 5px 0;
            color: #ffffff;
        }
        .contact-info a {
            color: #FFD93D; /* Yellow link */
            text-decoration: none;
        }
        .footer { 
            text-align: center; 
            padding: 10px; 
            font-size: 12px; 
            color: #ffffff; 
            background-color: #333333; /* Darker gray background */
        }
        .footer-logo {
            max-width: 100%;
            height: auto;
            margin-top: 10px;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <img src="https://maxitransport.eu/images/logo.png" alt="Maxi Transport Logo" class="logo">
            <h2>📄 Yeni Dosya Bildirimi / New File Notification</h2>
        </div>
        <div class="content">
            <div class="notification-box">
                <p>Sayın/ Dear ${file.customer || 'İlgili'},</p>
                <p><span style="color: #FFD93D; font-weight: bold;">${file.pozNo}</span> pozisyonu için yeni bir dosya yüklenmiştir. / A new file has been uploaded for position <span style="color: #FFD93D; font-weight: bold;">${file.pozNo}</span>.</p>
            </div>
            
            <table class="info-table">
                <tr>
                    <td>Dosya Adı / File Name:</td>
                    <td>
                        ${file.DosyaAdi}
                        <span class="info-badge">${file.Tip || 'Belge'}</span>
                    </td>
                </tr>
                <tr>
                    <td>Pozisyon No / Position No:</td>
                    <td>${file.pozNo}</td>
                </tr>
                <tr>
                    <td>Gönderici / Sender:</td>
                    <td>${file.sender || '-'}</td>
                </tr>
                <tr>
                    <td>Alıcı / Receiver:</td>
                    <td>${file.receiver || '-'}</td>
                </tr>
                <tr>
                    <td>Tarih / Date:</td>
                    <td>${file.tarih.toLocaleString('tr-TR', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}</td>
                </tr>
                <tr>
                    <td>Açıklama / Description:</td>
                    <td>${file.aciklama}</td>
                </tr>
                <tr>
                    <td>Dosya Şifresi / File Password:</td>
                    <td>${file.pozNo + file.id}</td>
                </tr>
            </table>

            <div class="file-link">
                <p>Dosya Linki / File Link:</p>
                <a href="${baseUrl}/download?id=${file.id}">
                    ${baseUrl}/download?id=${file.id}
                </a>
            </div>
            
            <div class="contact-info">
                <p><strong>İletişim / Contact</strong></p>
                <p>
                    📧 
                    <a href="mailto:info@maxitransport.net">
                        info@maxitransport.net
                    </a>
                </p>
                <p>
                    <span style="font-size: 18px; color: #25D366;">
                        <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/6/6b/WhatsApp.svg/1200px-WhatsApp.svg.png" alt="WhatsApp" width="18" height="18" style="vertical-align: middle;">
                    </span> 
                    <a href="https://wa.me/905416139740">
                        WhatsApp: +90 541 613 97 40
                    </a>
                </p>
            </div>
        </div>
        <div class="footer">
            <p>Bu bildirim ${new Date().toLocaleString('tr-TR', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            })} tarihinde otomatik olarak gönderilmiştir.</p>
            <p>This notification was automatically sent on ${new Date().toLocaleString(
              'en-US',
              {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              },
            )}.</p>
            <img src="https://customer.maxitransport.net/images/footer.jpg" alt="Maxi Transport Footer Image" class="footer-logo">
            <p style="color: #FFD93D;">© ${new Date().getFullYear()} Maxi Logistics | Tüm hakları saklıdır / All rights reserved</p>

        </div>
    </div>
</body>
</html>`;
};
