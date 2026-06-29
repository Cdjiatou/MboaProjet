import nodemailer from 'nodemailer';

let transporter: nodemailer.Transporter | null = null;

const getTransporter = async () => {
  if (transporter) return transporter;

  const host = process.env.SMTP_HOST;
  const port = parseInt(process.env.SMTP_PORT || '587', 10);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (host && user && pass) {
    // Transporter configuré en production/développement via .env
    transporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: { user, pass },
    });
    console.log(`[Email] Transporteur SMTP configuré pour ${host}:${port}`);
  } else {
    // Fallback : Compte de test Ethereal généré dynamiquement
    try {
      const testAccount = await nodemailer.createTestAccount();
      transporter = nodemailer.createTransport({
        host: 'smtp.ethereal.email',
        port: 587,
        secure: false,
        auth: {
          user: testAccount.user,
          pass: testAccount.pass,
        },
      });
      console.log(`[Email] Transporteur de test Ethereal généré :`);
      console.log(`[Email] Ethereal User : ${testAccount.user}`);
      console.log(`[Email] Ethereal Pass : ${testAccount.pass}`);
    } catch (err) {
      console.error('[Email] Impossible de créer le transporteur Ethereal, repli sur console :', err);
      transporter = null;
    }
  }

  return transporter;
};

/**
 * Envoie un email d'OTP à un candidat
 */
export const sendOtpEmail = async (email: string, candidateName: string, otp: string): Promise<boolean> => {
  const subject = 'Votre code de validation MBOA NEXT STAR 🌟';
  const html = `
    <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; max-width: 600px; margin: auto; padding: 40px 30px; border: 1px solid #1a1a1a; border-radius: 16px; background-color: #050505; color: #ffffff;">
      
      <!-- En-tête -->
      <div style="text-align: center; margin-bottom: 30px;">
        <h1 style="color: #d4af37; font-size: 24px; font-weight: 900; letter-spacing: 2px; text-transform: uppercase; margin: 0;">MBOA NEXT STAR</h1>
        <p style="color: #888888; font-size: 12px; text-transform: uppercase; letter-spacing: 1px; margin-top: 5px;">Validation de candidature</p>
      </div>

      <hr style="border: 0; border-top: 1px solid rgba(212, 175, 55, 0.2); margin: 0 0 30px 0;" />
      
      <!-- Corps du message -->
      <p style="font-size: 16px; color: #e5e5e5; line-height: 1.6; margin-bottom: 20px;">Bonjour <strong style="color: #ffffff;">${candidateName}</strong>,</p>
      
      <p style="font-size: 15px; color: #a3a3a3; line-height: 1.6; margin-bottom: 30px;">
        Félicitations pour votre inscription à la nouvelle édition de <strong>MBOA NEXT STAR</strong>. 
        Pour des raisons de sécurité et afin de valider définitivement votre profil, veuillez saisir le code d'authentification ci-dessous.
      </p>
      
      <!-- Boîte du Code -->
      <div style="background: linear-gradient(145deg, #111111 0%, #0a0a0a 100%); border: 1px solid rgba(212, 175, 55, 0.3); padding: 25px; border-radius: 12px; text-align: center; margin: 35px 0; box-shadow: 0 10px 30px rgba(0,0,0,0.5);">
        <span style="font-size: 12px; color: #888888; text-transform: uppercase; letter-spacing: 2px; display: block; margin-bottom: 10px;">Votre code de sécurité</span>
        <span style="font-size: 38px; font-weight: 900; letter-spacing: 8px; color: #d4af37; text-shadow: 0 2px 10px rgba(212,175,55,0.2);">${otp}</span>
      </div>
      
      <!-- Avertissement -->
      <p style="font-size: 13px; color: #666666; line-height: 1.5; text-align: center; margin-bottom: 40px;">
        Veuillez noter que ce code expirera sous peu.<br />
        Il est strictement personnel et ne doit en aucun cas être partagé.
      </p>
      
      <hr style="border: 0; border-top: 1px solid rgba(255, 255, 255, 0.05); margin: 30px 0;" />
      
      <!-- Signature -->
      <p style="font-size: 14px; color: #888888; margin: 0;">
        Cordialement,<br />
        <strong style="color: #d4af37; font-weight: 600;">L'équipe MBOA NEXT STAR</strong>
      </p>
    </div>
  `;

  try {
    const activeTransporter = await getTransporter();
    if (activeTransporter) {
      const info = await activeTransporter.sendMail({
        from: '"MBOA NEXT STAR" <no-reply@mboanextstar.com>',
        to: email,
        subject,
        html,
      });

      console.log(`[Email] Message envoyé à ${email}. Message ID: ${info.messageId}`);
      
      // Si c'est ethereal, log le lien de prévisualisation
      const previewUrl = nodemailer.getTestMessageUrl(info);
      if (previewUrl) {
        console.log(`[Email] Lien de prévisualisation Ethereal : ${previewUrl}`);
      }
      return true;
    } else {
      console.log(`[Email MOCK] Vers : ${email}\nSujet : ${subject}\nCode : ${otp}`);
      return true;
    }
  } catch (error) {
    console.error(`[Email] Erreur lors de l'envoi d'email à ${email} :`, error);
    return false;
  }
};
