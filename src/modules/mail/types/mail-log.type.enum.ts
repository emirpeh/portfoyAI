export enum MailLogType {
  // Alıcıdan gelen talepler
  PROPERTY_INQUIRY_BUYER = 'PROPERTY_INQUIRY_BUYER', // Alıcı yeni bir emlak talebi gönderdi (AI parse için)
  PROPERTY_UPDATE_BUYER = 'PROPERTY_UPDATE_BUYER', // Alıcı mevcut talebini güncelledi
  VIEWING_REQUEST_BUYER = 'VIEWING_REQUEST_BUYER', // Alıcı bir mülk için görme talebinde bulundu

  // Satıcıdan gelen talepler
  LISTING_SUBMISSION_SELLER = 'LISTING_SUBMISSION_SELLER', // Satıcı yeni bir ilan gönderdi (AI parse için)
  LISTING_UPDATE_SELLER = 'LISTING_UPDATE_SELLER', // Satıcı mevcut ilanını güncelledi

  // Sistem tarafından gönderilenler
  MATCH_NOTIFICATION_BUYER = 'MATCH_NOTIFICATION_BUYER', // Alıcıya uygun emlak bulundu bildirimi
  NEW_LISTING_ALERT_BUYER = 'NEW_LISTING_ALERT_BUYER', // Alıcının kriterlerine uyan yeni ilan bildirimi
  VIEWING_CONFIRMATION_BUYER = 'VIEWING_CONFIRMATION_BUYER', // Alıcıya randevu onayı
  VIEWING_REMINDER_BUYER = 'VIEWING_REMINDER_BUYER', // Alıcıya randevu hatırlatması
  VIEWING_CONFIRMATION_SELLER = 'VIEWING_CONFIRMATION_SELLER', // Satıcıya randevu onayı
  VIEWING_REMINDER_SELLER = 'VIEWING_REMINDER_SELLER', // Satıcıya randevu hatırlatması
  ACCOUNT_ACTIVATION = 'ACCOUNT_ACTIVATION',
  PASSWORD_RESET = 'PASSWORD_RESET',
  NEWSLETTER = 'NEWSLETTER',
  INTERNAL_MATCH_ALERT = 'INTERNAL_MATCH_ALERT', // Admin veya sisteme dahili eşleşme bildirimi

  // Genel & Diğer
  GENERAL_COMMUNICATION = 'GENERAL_COMMUNICATION',
  SYSTEM_ALERT = 'SYSTEM_ALERT',
  OTHER = 'OTHER',

  // Hata ve Analiz Durumları
  PROCESSING = 'PROCESSING', // E-posta alındı ve işleme kuyruğuna girdi
  GPT_ANALYSIS_SUCCESS = 'GPT_ANALYSIS_SUCCESS', // GptService.analyzeRealEstateEmail başarılı olduğunda
  GPT_ANALYSIS_FAILED = 'GPT_ANALYSIS_FAILED', // GptService.analyzeRealEstateEmail başarısız olduğunda veya null döndüğünde
  ERROR_PROCESSING_MAIL = 'ERROR_PROCESSING_MAIL', // MailService.processMail genel hata yakaladığında
  SEARCH_REQUEST_MISSING_INFO_REMINDER = 'SEARCH_REQUEST_MISSING_INFO_REMINDER', // JobService'den gelen hatırlatma

  // Yeni eklenen tipler
  PROPERTY_DETAILS_REQUEST = 'PROPERTY_DETAILS_REQUEST',
  PROPERTY_LISTING_CONFIRMATION = 'PROPERTY_LISTING_CONFIRMATION',
  GENERIC_CUSTOMER_REPLY = 'GENERIC_CUSTOMER_REPLY',
  UNKNOWN = 'UNKNOWN',
  BUYER_INQUIRY = 'BUYER_INQUIRY',
  SELLER_LISTING = 'SELLER_LISTING',
}
