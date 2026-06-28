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
    <div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #eee; border-radius: 12px; background-color: #0c0c12; color: #ffffff;">
      <h2 style="color: #d4af37; text-align: center;">MBOA NEXT STAR</h2>
      <hr style="border: 0; border-top: 1px solid #d4af37; margin: 20px 0;" />
      <p>Bonjour <strong>${candidateName}</strong>,</p>
      <p>Bienvenue dans l'aventure MBOA NEXT STAR ! Afin de valider votre inscription et votre numéro de téléphone, veuillez utiliser le code de vérification à usage unique (OTP) ci-dessous :</p>
      <div style="background-color: rgba(212, 175, 55, 0.1); border: 1px dashed #d4af37; padding: 15px; border-radius: 8px; text-align: center; margin: 25px 0;">
        <span style="font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #d4af37;">${otp}</span>
      </div>
      <p style="font-size: 13px; color: #a0a0a8;">Ce code est strictement personnel et confidentiel. Ne le partagez avec personne.</p>
      <p style="margin-top: 30px;">L'équipe MBOA NEXT STAR</p>
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
