import {
  createContext,
  useContext,
  useLayoutEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

export type Language = 'tr' | 'en';

type TranslationEntry = {
  en: string;
  tr: string;
  aliases?: string[];
};

type I18nContextValue = {
  language: Language;
  setLanguage: (language: Language) => void;
  toggleLanguage: () => void;
  t: (value: string) => string;
};

const STORAGE_KEY = 'spa-language';

const translationEntries: TranslationEntry[] = [
  { en: 'Strategic Planning Tracking System', tr: 'Stratejik Planlama Takip Sistemi' },
  { en: 'Phase 1 Prototype', tr: 'Faz 1 Prototipi' },
  { en: 'Select Role', tr: 'Rol Seçin' },
  { en: 'Select Unit', tr: 'Birim Seçin' },
  { en: 'Login to System', tr: 'Sisteme Giriş Yap' },
  { en: 'Demo Mode:', tr: 'Demo Modu:' },
  {
    en: 'This Phase 1 prototype uses synthetic data for testing and demonstration purposes.',
    tr: 'Bu Faz 1 prototipi, test ve gösterim amaçları için sentetik veriler kullanır.',
  },
  { en: 'Academic Year', tr: 'Akademik Yıl' },
  { en: 'Academic Year Range', tr: 'Akademik Yıl Aralığı' },
  { en: 'Edit', tr: 'Düzenle', aliases: ['Duzenle', 'Düzenle', 'DAzenle'] },
  { en: 'View Only', tr: 'Salt Görüntüleme' },
  { en: 'Logout', tr: 'Çıkış Yap' },
  { en: 'Dashboard', tr: 'Panel' },
  { en: 'Goal Hierarchy', tr: 'Hedef Hiyerarşisi' },
  { en: 'My Assigned Goals', tr: 'Atanan Hedeflerim' },
  { en: 'Analytics', tr: 'Analitik' },
  { en: 'Assignments', tr: 'Atamalar' },
  { en: 'Milestones', tr: 'Kilometre Taşları' },
  { en: 'Timeline', tr: 'Zaman Çizelgesi' },
  { en: 'Dashboard Overview', tr: 'Panel Özeti' },
  { en: 'Organization-Wide Performance', tr: 'Kurum Geneli Performansı' },
  { en: 'Performance', tr: 'Performans' },
  { en: 'Goals', tr: 'Hedefler' },
  { en: 'Goal', tr: 'Hedef' },
  { en: 'Sub Goal', tr: 'Alt Hedef' },
  { en: 'SubGoals', tr: 'Alt Hedefler' },
  { en: 'Sub Goal', tr: 'Alt Hedef' },
  { en: 'Sub Item', tr: 'Alt Öğe' },
  { en: 'Main Goal', tr: 'Ana Hedef' },
  { en: 'Main Goals', tr: 'Ana Hedefler' },
  { en: 'No KPI data found for the selected year.', tr: 'Seçilen yıl için KPI verisi bulunamadı.' },
  { en: 'Confirm Delete', tr: 'Silmeyi Onayla' },
  { en: 'Are you sure you want to delete this item?', tr: 'Bu öğeyi silmek istediğinizden emin misiniz?' },
  {
    en: 'This will also delete all sub-goals, KPIs, and actions.',
    tr: 'Bu işlem tüm alt hedefleri, KPI\'ları ve eylemleri de silecektir.',
  },
  { en: 'Sub Goals', tr: 'Alt Hedefler' },
  { en: 'Goal Name', tr: 'Hedef Adı' },
  { en: 'Goal Title', tr: 'Hedef Başlığı' },
  { en: 'Description', tr: 'Açıklama', aliases: ['Aciklama'] },
  { en: 'Title', tr: 'Başlık', aliases: ['Baslik'] },
  { en: 'Name', tr: 'Ad' },
  { en: 'Status', tr: 'Durum' },
  { en: 'Priority', tr: 'Öncelik' },
  { en: 'Owner', tr: 'Sahip' },
  { en: 'Assigned To', tr: 'Atanan Kişi' },
  { en: 'No KPI data found for the selected year.', tr: 'Seçilen yıl için KPI verisi bulunamadı.' },
  { en: 'Confirm Delete', tr: 'Silmeyi Onayla' },
  { en: 'Are you sure you want to delete this item?', tr: 'Bu öğeyi silmek istediğinizden emin misiniz?' },
  { en: 'Deleting...', tr: 'Siliniyor...' },
  { en: 'Delete', tr: 'Sil' },
  { en: 'Assigned to:', tr: 'Atanan kişi:' },
  { en: 'Assigned By', tr: 'Atayan' },
  { en: 'Assigned Date', tr: 'Atama Tarihi' },
  { en: 'Responsible Unit', tr: 'Sorumlu Birim' },
  { en: 'Unit', tr: 'Birim' },
  { en: 'Units', tr: 'Birimler' },
  { en: 'Actions', tr: 'Aksiyonlar' },
  { en: 'Action', tr: 'Aksiyon' },
  { en: 'Action Plan', tr: 'Aksiyon Planı' },
  { en: 'Action Plans', tr: 'Aksiyon Planları' },
  { en: 'KPI', tr: 'KPI' },
  { en: 'KPIs', tr: 'KPI\'lar' },
  { en: 'Alerts', tr: 'Uyarılar' },
  { en: 'Items requiring attention', tr: 'Dikkat gerektiren öğeler' },
  { en: 'Dashboard data is loading...', tr: 'Panel verileri yükleniyor...' },
  { en: 'No goals found for the selected year.', tr: 'Seçilen yıl için hedef bulunamadı.' },
  { en: 'No upcoming action deadlines.', tr: 'Yaklaşan aksiyon son tarihi yok.' },
  { en: 'days', tr: 'gün' },
  { en: 'Average Progress', tr: 'Ortalama İlerleme' },
  { en: 'On Target', tr: 'Hedefte' },
  { en: 'Average Goal Progress', tr: 'Ortalama Hedef İlerlemesi' },
  { en: 'Average KPI Achievement', tr: 'Ortalama KPI Gerçekleşmesi' },
  { en: 'Goals by Status', tr: 'Duruma Göre Hedefler' },
  { en: 'Upcoming Deadlines', tr: 'Yaklaşan Son Tarihler' },
  { en: 'KPI Performance Overview', tr: 'KPI Performans Özeti' },
  { en: 'Detailed performance analysis and visualization', tr: 'Detaylı performans analizi ve görselleştirme' },
  { en: 'Analytics & Charts', tr: 'Analitik ve Grafikler' },
  { en: 'Current Period:', tr: 'Mevcut Dönem:' },
  { en: 'Previous Period:', tr: 'Önceki Dönem:' },
  { en: 'Total Goals', tr: 'Toplam Hedef' },
  { en: 'At Risk / Delayed', tr: 'Riskte / Gecikmiş' },
  { en: 'Goals Distribution by Status', tr: 'Duruma Göre Hedef Dağılımı' },
  { en: 'Goals Distribution by Priority', tr: 'Önceliğe Göre Hedef Dağılımı' },
  { en: 'Goals Distribution by Level', tr: 'Seviyeye Göre Hedef Dağılımı' },
  { en: 'Unit Performance Comparison', tr: 'Birim Performans Karşılaştırması' },
  { en: 'Monthly Progress Trend (2025)', tr: 'Aylık İlerleme Eğilimi (2025)' },
  { en: 'KPI Performance Comparison', tr: 'KPI Performans Karşılaştırması' },
  { en: 'Unit Performance Radar', tr: 'Birim Performans Radarı' },
  { en: 'Detailed Unit Statistics', tr: 'Detaylı Birim İstatistikleri' },
  { en: 'Goal Progress', tr: 'Hedef İlerlemesi' },
  { en: 'KPI Achievement', tr: 'KPI Gerçekleşmesi' },
  { en: 'Overall Performance', tr: 'Genel Performans' },
  { en: 'Previous Year', tr: 'Önceki Yıl' },
  { en: 'Change', tr: 'Değişim' },
  { en: 'My Assigned Goals', tr: 'Atanan Hedeflerim' },
  { en: 'Goals and tasks assigned to you', tr: 'Size atanan hedefler ve görevler' },
  { en: 'Filters', tr: 'Filtreler' },
  { en: 'Choose the filter', tr: 'Filtre seçin' },
  { en: 'Department', tr: 'Departman' },
  { en: 'Search by Name...', tr: 'Ada göre ara...' },
  { en: 'Search by Department...', tr: 'Departmana göre ara...' },
  { en: 'Search by Goal Name...', tr: 'Hedef adına göre ara...' },
  { en: 'Select a filter first...', tr: 'Önce bir filtre seçin...' },
  { en: 'Add', tr: 'Ekle' },
  { en: 'Clear filter', tr: 'Filtreyi temizle' },
  { en: 'Filter by Status', tr: 'Duruma Göre Filtrele' },
  { en: 'Filter by Owner', tr: 'Sahibe Göre Filtrele' },
  { en: 'Filter by Due Date', tr: 'Bitiş Tarihine Göre Filtrele' },
  { en: 'Filter by Unit', tr: 'Birime Göre Filtrele' },
  { en: 'All Statuses', tr: 'Tüm Durumlar' },
  { en: 'All Units', tr: 'Tüm Birimler' },
  { en: 'All Goals', tr: 'Tüm Hedefler' },
  { en: 'All Tasks', tr: 'Tüm Görevler' },
  { en: 'My Tasks', tr: 'Görevlerim' },
  { en: 'All Owners', tr: 'Tüm Sahipler' },
  { en: 'All Dates', tr: 'Tüm Tarihler' },
  { en: 'Sort By', tr: 'Sırala' },
  { en: 'Ascending', tr: 'Artan' },
  { en: 'Descending', tr: 'Azalan' },
  { en: 'Total Assigned', tr: 'Toplam Atanan' },
  { en: 'Progress', tr: 'İlerleme' },
  { en: 'No Goals Assigned', tr: 'Atanmış Hedef Yok' },
  {
    en: 'You don\'t have any goals assigned to you matching the selected filters.',
    tr: 'Seçilen filtrelere uyan size atanmış bir hedef bulunmuyor.',
  },
  { en: 'Assignment Management', tr: 'Atama Yönetimi' },
  { en: 'Goal, KPI, and action plan assignments', tr: 'Hedef, KPI ve aksiyon planı atamaları' },
  { en: 'Create New Assignment', tr: 'Yeni Atama Oluştur' },
  { en: 'Accepted', tr: 'Kabul Edildi' },
  { en: 'Pending', tr: 'Beklemede' },
  { en: 'Rejected', tr: 'Reddedildi' },
  { en: 'In Progress', tr: 'Devam Ediyor' },
  { en: 'Not Started', tr: 'Başlanmadı' },
  { en: 'On Track', tr: 'Yolunda' },
  { en: 'At Risk', tr: 'Riskte' },
  { en: 'Delayed', tr: 'Gecikmiş' },
  { en: 'Completed', tr: 'Tamamlandı' },
  { en: 'Blocked', tr: 'Bloke' },
  { en: 'Overdue', tr: 'Gecikmiş' },
  { en: 'Low', tr: 'Düşük' },
  { en: 'Medium', tr: 'Orta' },
  { en: 'High', tr: 'Yüksek' },
  { en: 'Critical', tr: 'Kritik' },
  { en: 'Notes', tr: 'Notlar' },
  { en: 'Deadline', tr: 'Son Tarih' },
  { en: 'Timeline', tr: 'Zaman Çizelgesi' },
  { en: 'Calendar & Timeline', tr: 'Takvim ve Zaman Çizelgesi' },
  { en: 'Goals and action plans timeline', tr: 'Hedef ve aksiyon planı zaman çizelgesi' },
  { en: 'Monthly', tr: 'Aylık' },
  { en: 'Yearly', tr: 'Yıllık' },
  { en: 'Showing only tasks assigned to you', tr: 'Yalnızca size atanan görevler gösteriliyor' },
  {
    en: 'Showing demo timeline items because no events match the current filters.',
    tr: 'Mevcut filtrelere uyan etkinlik olmadığı için demo zaman çizelgesi öğeleri gösteriliyor.',
  },
  { en: 'Goal - On Track', tr: 'Hedef - Yolunda' },
  { en: 'Goal - At Risk', tr: 'Hedef - Riskte' },
  { en: 'Goal - Delayed', tr: 'Hedef - Gecikmiş' },
  { en: 'Action - In Progress', tr: 'Aksiyon - Devam Ediyor' },
  { en: 'Academic Calendar', tr: 'Akademik Takvim' },
  { en: 'Manage the academic year list shown in the selector.', tr: 'Seçicide gösterilen akademik yıl listesini yönetin.' },
  { en: 'Manage the academic year list and define unit owners for each year.', tr: 'Akademik yıl listesini yönetin ve her yıl için birim sorumlularını tanımlayın.' },
  { en: 'Back', tr: 'Geri Dön' },
  { en: 'Add academic year', tr: 'Akademik yıl ekle' },
  { en: 'Use format 2025-26 (or 25-26).', tr: '2025-26 (veya 25-26) formatını kullanın.' },
  { en: 'This academic year is already listed.', tr: 'Bu akademik yıl zaten listede.' },
  { en: 'Accepted formats: 2025-26, 2025-2026, or 25-26.', tr: 'Kabul edilen formatlar: 2025-26, 2025-2026 veya 25-26.' },
  { en: 'Available Years', tr: 'Mevcut Yıllar' },
  { en: 'total', tr: 'toplam' },
  { en: 'No academic years yet. Add one to get started.', tr: 'Henüz akademik yıl yok. Başlamak için bir tane ekleyin.' },
  { en: 'Selected', tr: 'Seçili' },
  { en: 'Current', tr: 'Güncel' },
  { en: 'Remove academic year', tr: 'Akademik yılı kaldır' },
  { en: 'At least one year is required', tr: 'En az bir yıl gerekli' },
  { en: 'Hierarchy', tr: 'Hiyerarşi' },
  { en: 'Overview', tr: 'Genel Bakış' },
  { en: 'Save', tr: 'Kaydet' },
  { en: 'Saving...', tr: 'Kaydediliyor...' },
  { en: 'Cancel', tr: 'Vazgeç', aliases: ['Vazgec'] },
  { en: 'Hedef bulunamadı.', tr: 'Hedef bulunamadı.' },
  { en: 'General Bakış', tr: 'Genel Bakış' },
  { en: 'Ana Hedef', tr: 'Ana Hedef' },
  { en: 'Alt Hedef', tr: 'Alt Hedef' },
  { en: 'Alt Item', tr: 'Alt Öğe' },
  { en: 'Sorumlu Birim', tr: 'Sorumlu Birim' },
  { en: 'Durum', tr: 'Durum' },
  { en: 'Başlık', tr: 'Başlık' },
  { en: 'Açıklama', tr: 'Açıklama' },
  { en: 'Aksiyon Planları', tr: 'Aksiyon Planları' },
  { en: 'Hiyerarşi', tr: 'Hiyerarşi' },
  { en: 'KPI\'lar', tr: 'KPI\'lar' },
  { en: 'Goal Hierarchy', tr: 'Hedef Hiyerarşisi' },
  { en: 'Main goals, sub goals, KPIs and actions', tr: 'Ana hedefler, alt hedefler, KPI\'lar ve aksiyonlar' },
  { en: 'Main Goal', tr: 'Ana Hedef' },
  { en: 'Level 0', tr: 'Seviye 0' },
  { en: 'Level 1', tr: 'Seviye 1' },
  { en: 'Level 2 (table format)', tr: 'Seviye 2 (tablo görünümü)' },
  { en: 'KPI / Action', tr: 'KPI / Aksiyon' },
  { en: 'No goals found matching the selected filters.', tr: 'Seçilen filtrelere uyan hedef bulunamadı.' },
  { en: 'Add KPI', tr: 'KPI Ekle' },
  { en: 'Add Action', tr: 'Aksiyon Ekle' },
  { en: 'Current', tr: 'Güncel' },
  { en: 'Target', tr: 'Hedef' },
  { en: 'No KPIs found matching the selected filters.', tr: 'Seçilen filtrelere uyan KPI bulunamadı.' },
  { en: 'No action plans found matching the selected filters.', tr: 'Seçilen filtrelere uyan aksiyon planı bulunamadı.' },
  { en: 'Copy from Previous Academic Period', tr: 'Önceki Akademik Dönemden Kopyala' },
  { en: 'Select Source Academic Period', tr: 'Kaynak Akademik Dönemi Seçin' },
  { en: 'Choose the academic period you want to copy from', tr: 'Kopyalamak istediğiniz kaynak akademik dönemi seçin' },
  { en: 'Selected Source:', tr: 'Seçilen Kaynak:' },
  { en: 'Select Target Academic Period', tr: 'Hedef Akademik Dönemi Seçin' },
  { en: 'Choose the academic period you want to copy to', tr: 'Kopyalamak istediğiniz hedef akademik dönemi seçin' },
  { en: 'Copying from:', tr: 'Şuradan kopyalanıyor:' },
  { en: 'Copying to:', tr: 'Şuraya kopyalanıyor:' },
  { en: 'Select Copy Scope', tr: 'Kopyalama Kapsamını Seçin' },
  { en: 'Choose what to copy from the source period', tr: 'Kaynak dönemden neyin kopyalanacağını seçin' },
  { en: 'Copy Goals', tr: 'Hedefleri Kopyala' },
  { en: 'Copy Selected', tr: 'Seçilileri Kopyala' },
  { en: 'Copying...', tr: 'Kopyalanıyor...' },
  { en: 'Copy Previous Year Goals', tr: 'Önceki Yıl Hedeflerini Kopyala' },
  { en: 'Select at least one goal to copy.', tr: 'Kopyalamak için en az bir hedef seçin.' },
  { en: 'No main goals found for the selected source year.', tr: 'Seçilen kaynak yıl için ana hedef bulunamadı.' },
  { en: 'Failed to copy goals from previous academic year', tr: 'Önceki akademik yıldan hedefler kopyalanamadı' },
  { en: 'Add Main Goal', tr: 'Ana Hedef Ekle' },
  { en: 'Add Sub Goal', tr: 'Alt Hedef Ekle' },
  { en: 'All Levels', tr: 'Tüm Seviyeler' },
  { en: 'View Details', tr: 'Detayları Gör' },
  { en: 'All main goals (level 0)', tr: 'Tüm ana hedefler (seviye 0)' },
  { en: 'Copy SubGoals', tr: 'Alt Hedefleri Kopyala' },
  { en: 'All sub-goals and sub-items', tr: 'Tüm alt hedefler ve alt öğeler' },
  { en: 'Copy KPIs', tr: 'KPI\'ları Kopyala' },
  { en: 'Key Performance Indicators', tr: 'Anahtar Performans Göstergeleri' },
  { en: 'Copy Action Plans', tr: 'Aksiyon Planlarını Kopyala' },
  { en: 'All action plans linked to goals', tr: 'Hedeflere bağlı tüm aksiyon planları' },
  { en: 'Copy Milestones', tr: 'Kilometre Taşlarını Kopyala' },
  { en: 'All milestone checkpoints', tr: 'Tüm kilometre taşı kontrol noktaları' },
  { en: 'Reset Rules', tr: 'Sıfırlama Kuralları' },
  { en: 'Configure how copied items should be initialized', tr: 'Kopyalanan öğelerin nasıl başlatılacağını yapılandırın' },
  { en: 'Reset progress to 0%', tr: 'İlerlemeyi %0\'a sıfırla' },
  { en: 'All progress bars will start at 0%', tr: 'Tüm ilerleme çubukları %0\'dan başlayacak' },
  { en: 'Reset statuses to Not Started', tr: 'Durumları Başlanmadı olarak sıfırla' },
  { en: 'All items will have status "Not Started"', tr: 'Tüm öğeler "Başlanmadı" durumuyla oluşturulacak' },
  { en: 'Note:', tr: 'Not:' },
  { en: 'Titles and descriptions will be kept as-is', tr: 'Başlıklar ve açıklamalar olduğu gibi korunacak' },
  { en: 'Start and end dates will be adjusted to match the target year boundaries', tr: 'Başlangıç ve bitiş tarihleri hedef yıl sınırlarına göre ayarlanacak' },
  { en: 'Assignments and ownership will be preserved', tr: 'Atamalar ve sahiplik korunacak' },
  { en: 'Copy Completed Successfully!', tr: 'Kopyalama Başarıyla Tamamlandı!' },
  { en: 'Items Copied:', tr: 'Kopyalanan Öğeler:' },
  { en: 'Goals:', tr: 'Hedefler:' },
  { en: 'SubGoals:', tr: 'Alt Hedefler:' },
  { en: 'KPIs:', tr: 'KPI\'lar:' },
  { en: 'Action Plans:', tr: 'Aksiyon Planları:' },
  { en: 'Milestones:', tr: 'Kilometre Taşları:' },
  { en: 'Total Items:', tr: 'Toplam Öğe:' },
  { en: 'Calendar', tr: 'Takvim' },
  { en: 'Calendar & Timeline', tr: 'Takvim ve Zaman Çizelgesi' },
  { en: 'Total Milestones', tr: 'Toplam Kilometre Taşı' },
  { en: 'Unit Owners', tr: 'Birim Sorumluları' },
  { en: 'Goals and copied work can be assigned automatically to these owners.', tr: 'Hedefler ve kopyalanan işler bu kişilere otomatik atanabilir.' },
  { en: 'Unit owner name cannot be empty.', tr: 'Birim sorumlusu adı boş olamaz.' },
  { en: 'Failed to load unit owners', tr: 'Birim sorumluları yüklenemedi' },
  { en: 'Failed to save unit owner', tr: 'Birim sorumlusu kaydedilemedi' },
  { en: 'Enter unit owner', tr: 'Birim sorumlusu girin' },
  { en: 'No milestones found matching the selected filters.', tr: 'Seçilen filtrelere uyan kilometre taşı bulunamadı.' },
  { en: 'Upcoming', tr: 'Yaklaşan' },
  { en: 'Evidence Links', tr: 'Kanıt Bağlantıları' },
  { en: 'Progress Updates', tr: 'İlerleme Güncellemeleri' },
  { en: 'Definition of Done', tr: 'Tamamlanma Kriteri' },
  { en: 'Create Milestone', tr: 'Kilometre Taşı Oluştur' },
  { en: 'Add Progress Update', tr: 'İlerleme Güncellemesi Ekle' },
  { en: 'Add Evidence Link', tr: 'Kanıt Bağlantısı Ekle' },
  { en: 'Previous', tr: 'Önceki' },
  { en: 'Next', tr: 'Sonraki' },
  { en: 'Close', tr: 'Kapat' },
  { en: 'January', tr: 'Ocak' },
  { en: 'February', tr: 'Şubat' },
  { en: 'March', tr: 'Mart' },
  { en: 'April', tr: 'Nisan' },
  { en: 'May', tr: 'Mayıs' },
  { en: 'June', tr: 'Haziran' },
  { en: 'July', tr: 'Temmuz' },
  { en: 'August', tr: 'Ağustos' },
  { en: 'September', tr: 'Eylül' },
  { en: 'October', tr: 'Ekim' },
  { en: 'November', tr: 'Kasım' },
  { en: 'December', tr: 'Aralık' },
  { en: 'Strategy Office', tr: 'Strateji Ofisi' },
  { en: 'Unit Manager', tr: 'Birim Yöneticisi' },
  { en: 'Senior Management', tr: 'Üst Yönetim' },
  { en: 'Research Department', tr: 'Araştırma Departmanı' },
  { en: 'Academic Affairs', tr: 'Akademik İşler' },
  { en: 'IT Department', tr: 'BT Departmanı' },
  { en: 'External Relations', tr: 'Dış İlişkiler' },
  { en: 'Facilities Management', tr: 'Tesis Yönetimi' },
  { en: 'Finance Department', tr: 'Finans Departmanı' },
  { en: 'Human Resources', tr: 'İnsan Kaynakları' },
  { en: 'Student Affairs', tr: 'Öğrenci İşleri' },
  { en: 'General', tr: 'Genel' },
  { en: 'Strategy Office Manager', tr: 'Strateji Ofisi Müdürü' },
  { en: 'General Manager', tr: 'Genel Müdür' },
  { en: 'Research Department Manager', tr: 'Araştırma Departmanı Müdürü' },
  { en: 'Academic Affairs Manager', tr: 'Akademik İşler Müdürü' },
  { en: 'IT Department Manager', tr: 'BT Departmanı Müdürü' },
  { en: 'External Relations Manager', tr: 'Dış İlişkiler Müdürü' },
  { en: 'Facilities Management Manager', tr: 'Tesis Yönetimi Müdürü' },
  { en: 'Finance Department Manager', tr: 'Finans Departmanı Müdürü' },
  { en: 'Human Resources Manager', tr: 'İnsan Kaynakları Müdürü' },
  { en: 'Student Affairs Manager', tr: 'Öğrenci İşleri Müdürü' },
  { en: 'Enhance Research Quality and Impact', tr: 'Araştırma Kalitesini ve Etkisini Artır' },
  { en: 'Increase publications in high-impact journals and strengthen research collaborations across departments.', tr: 'Yüksek etkili dergilerde yayın sayısını artırın ve bölümler arası araştırma iş birliklerini güçlendirin.' },
  { en: 'Increase International Publications', tr: 'Uluslararası Yayınları Artır' },
  { en: 'Achieve 30% growth in Q1 journal publications through targeted support programs', tr: 'Hedefli destek programlarıyla Q1 dergi yayınlarında %30 artış sağlayın' },
  { en: 'Organize Academic Writing Workshops', tr: 'Akademik Yazım Atölyeleri Düzenle' },
  { en: 'Monthly scientific writing training sessions for faculty and graduate students', tr: 'Akademisyenler ve lisansüstü öğrenciler için aylık bilimsel yazım eğitimleri' },
  { en: 'Develop Research Partnerships', tr: 'Araştırma Ortaklıkları Geliştir' },
  { en: 'Establish new international research collaborations and joint projects', tr: 'Yeni uluslararası araştırma iş birlikleri ve ortak projeler oluşturun' },
  { en: 'Improve Student Success and Retention', tr: 'Öğrenci Başarısını ve Devamlılığını İyileştir' },
  { en: 'Enhance academic support services and reduce dropout rates through comprehensive student support.', tr: 'Kapsamlı öğrenci desteğiyle akademik destek hizmetlerini geliştirin ve okul terk oranlarını azaltın.' },
  { en: 'Launch Peer Mentorship Program', tr: 'Akran Mentorluk Programını Başlat' },
  { en: 'Peer mentorship program for first-year students to improve retention and academic performance', tr: 'Devamlılığı ve akademik performansı artırmak için birinci sınıf öğrencilerine yönelik akran mentorluk programı' },
  { en: 'Expand Academic Support Center', tr: 'Akademik Destek Merkezini Genişlet' },
  { en: 'Increase tutoring services and extend operating hours to support student learning', tr: 'Öğrenci öğrenimini desteklemek için etüt hizmetlerini artırın ve çalışma saatlerini uzatın' },
  { en: 'Digital Transformation Initiative', tr: 'Dijital Dönüşüm Girişimi' },
  { en: 'Modernize IT infrastructure and implement digital tools across all departments.', tr: 'BT altyapısını modernleştirin ve tüm birimlerde dijital araçlar uygulayın.' },
  { en: 'Learning Management System Upgrade', tr: 'Öğrenme Yönetim Sistemi Yükseltmesi' },
  { en: 'Migrate to new LMS platform and train all faculty members', tr: 'Yeni LMS platformuna geçin ve tüm öğretim üyelerini eğitin' },
  { en: 'Digital Document Management System', tr: 'Dijital Doküman Yönetim Sistemi' },
  { en: 'Implement document management system for administrative processes', tr: 'İdari süreçler için doküman yönetim sistemi uygulayın' },
  { en: 'Faculty Development and Excellence', tr: 'Akademik Personel Gelişimi ve Mükemmelliği' },
  { en: 'Enhance teaching quality through professional development workshops and training sessions.', tr: 'Mesleki gelişim atölyeleri ve eğitim oturumlarıyla öğretim kalitesini artırın.' },
  { en: 'Teaching Innovation Workshops', tr: 'Öğretim İnovasyonu Atölyeleri' },
  { en: 'Monthly workshops on innovative teaching methodologies and active learning', tr: 'Yenilikçi öğretim yöntemleri ve aktif öğrenme üzerine aylık atölyeler' },
  { en: 'Campus Infrastructure Modernization', tr: 'Kampüs Altyapısının Modernizasyonu' },
  { en: 'Modernize campus facilities and improve student learning environments.', tr: 'Kampüs tesislerini modernleştirin ve öğrenci öğrenme ortamlarını iyileştirin.' },
  { en: 'Library Renovation Project', tr: 'Kütüphane Yenileme Projesi' },
  { en: 'Upgrade library infrastructure with modern study spaces and technology', tr: 'Kütüphane altyapısını modern çalışma alanları ve teknolojiyle geliştirin' },
  { en: 'Student Engagement and Campus Life', tr: 'Öğrenci Katılımı ve Kampüs Yaşamı' },
  { en: 'Increase student participation in campus activities and student organizations.', tr: 'Kampüs etkinlikleri ve öğrenci topluluklarına katılımı artırın.' },
  { en: 'Campus Events and Activities', tr: 'Kampüs Etkinlikleri ve Faaliyetleri' },
  { en: 'Organize monthly campus-wide events and cultural activities', tr: 'Aylık kampüs geneli etkinlikler ve kültürel faaliyetler düzenleyin' },
  { en: 'Monthly Cultural Events', tr: 'Aylık Kültürel Etkinlikler' },
  { en: 'Organize diverse cultural celebrations and educational events', tr: 'Çeşitli kültürel kutlamalar ve eğitsel etkinlikler düzenleyin' },
  { en: 'High-Impact Publications', tr: 'Yüksek Etkili Yayınlar' },
  { en: 'Number of publications in Q1 journals', tr: 'Q1 dergilerindeki yayın sayısı' },
  { en: 'Research Collaborations', tr: 'Araştırma İş Birlikleri' },
  { en: 'Number of new international research partnerships established', tr: 'Kurulan yeni uluslararası araştırma ortaklığı sayısı' },
  { en: 'Increase Student Retention', tr: 'Öğrenci Devamlılığını Artır' },
  { en: 'Implement mentoring and support programs.', tr: 'Mentorluk ve destek programları uygulayın.' },
  { en: 'Enhance Advising Services', tr: 'Danışmanlık Hizmetlerini Geliştir' },
  { en: 'Expand advisor capacity and training.', tr: 'Danışman kapasitesini ve eğitimini artırın.' },
  { en: 'Student Success Initiative', tr: 'Öğrenci Başarısı Girişimi' },
  { en: 'Advising Workflow Redesign', tr: 'Danışmanlık İş Akışı Yeniden Tasarımı' },
  { en: 'Launch mentoring program', tr: 'Mentorluk programını başlat' },
  { en: 'Finalize mentor recruitment and onboarding.', tr: 'Mentor alımını ve uyum sürecini tamamlayın.' },
  { en: 'Advising satisfaction survey', tr: 'Danışmanlık memnuniyet anketi' },
  { en: 'Collect and analyze end-of-period survey data.', tr: 'Dönem sonu anket verilerini toplayın ve analiz edin.' },
  { en: 'Mentors recruited, onboarded, and matched to students.', tr: 'Mentorlar alındı, uyumlandırıldı ve öğrencilerle eşleştirildi.' },
  { en: 'Survey sent, response rate above 60%, report delivered.', tr: 'Anket gönderildi, yanıt oranı %60 üzerinde, rapor teslim edildi.' },
  { en: 'Follow up on retention initiatives.', tr: 'Devamlılık girişimlerini takip edin.' },
  { en: 'Prepare quarterly progress update.', tr: 'Çeyreklik ilerleme güncellemesini hazırlayın.' },
];

const I18nContext = createContext<I18nContextValue | undefined>(undefined);

const getStoredLanguage = (): Language => {
  if (typeof window === 'undefined') return 'tr';

  const stored = window.localStorage.getItem(STORAGE_KEY);
  return stored === 'en' ? 'en' : 'tr';
};

const normalizeWhitespace = (value: string) => {
  const leading = value.match(/^\s*/)?.[0] ?? '';
  const trailing = value.match(/\s*$/)?.[0] ?? '';
  const core = value.trim();
  return { leading, trailing, core };
};

const escapeForRegex = (value: string) =>
  value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const isWordLikeChar = (value: string) => /[\p{L}\p{N}]/u.test(value);

const replaceWithBoundaries = (input: string, source: string, target: string) => {
  const firstChar = source[0];
  const lastChar = source[source.length - 1];
  const needsBoundaryAtStart = Boolean(firstChar && isWordLikeChar(firstChar));
  const needsBoundaryAtEnd = Boolean(lastChar && isWordLikeChar(lastChar));

  if (!needsBoundaryAtStart && !needsBoundaryAtEnd) {
    return input.split(source).join(target);
  }

  const prefix = needsBoundaryAtStart ? '(^|[^\\p{L}\\p{N}])' : '(^|)';
  const suffix = needsBoundaryAtEnd ? '(?=[^\\p{L}\\p{N}]|$)' : '';
  const pattern = new RegExp(`${prefix}${escapeForRegex(source)}${suffix}`, 'gu');

  return input.replace(pattern, (_match, leading = '') => `${leading}${target}`);
};

const buildReplacementPairs = (language: Language) => {
  const pairs: Array<[string, string]> = [];

  for (const entry of translationEntries) {
    const source = language === 'tr' ? entry.en : entry.tr;
    const target = language === 'tr' ? entry.tr : entry.en;
    pairs.push([source, target]);

    for (const alias of entry.aliases ?? []) {
      pairs.push([alias, target]);
    }
  }

  return pairs
    .filter(([source, target]) => source && target && source !== target)
    .sort((left, right) => right[0].length - left[0].length);
};

const translateWithPairs = (value: string, replacements: Array<[string, string]>) => {
  if (!value) return value;

  const { leading, trailing, core } = normalizeWhitespace(value);
  if (!core) return value;

  let translated = core;

  for (const [source, target] of replacements) {
    if (translated.includes(source)) {
      translated = replaceWithBoundaries(translated, source, target);
    }
  }

  return `${leading}${translated}${trailing}`;
};

const shouldSkipElement = (element: Element | null) =>
  Boolean(element?.closest('[data-i18n-skip="true"]'));

const translateDomTree = (root: HTMLElement, replacements: Array<[string, string]>) => {
  const textWalker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);

  while (textWalker.nextNode()) {
    const node = textWalker.currentNode;
    const parent = node.parentElement;

    if (
      !parent ||
      shouldSkipElement(parent) ||
      ['SCRIPT', 'STYLE', 'NOSCRIPT', 'TEXTAREA'].includes(parent.tagName)
    ) {
      continue;
    }

    const translated = translateWithPairs(node.textContent ?? '', replacements);
    if (translated !== (node.textContent ?? '')) {
      node.textContent = translated;
    }
  }

  const elements = [
    root,
    ...Array.from(root.querySelectorAll<HTMLElement>('[placeholder],[title],[aria-label]')),
  ];

  for (const element of elements) {
    if (shouldSkipElement(element)) continue;

    for (const attribute of ['placeholder', 'title', 'aria-label'] as const) {
      const attributeValue = element.getAttribute(attribute);
      if (!attributeValue) continue;

      const translated = translateWithPairs(attributeValue, replacements);
      if (translated !== attributeValue) {
        element.setAttribute(attribute, translated);
      }
    }
  }
};

export function I18nProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState<Language>(getStoredLanguage);
  const replacements = useMemo(() => buildReplacementPairs(language), [language]);

  useLayoutEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, language);
    document.documentElement.lang = language;

    const root = document.getElementById('root');
    if (!root) return;

    let isTranslating = false;

    const runTranslation = () => {
      if (isTranslating) return;
      isTranslating = true;
      translateDomTree(root, replacements);
      isTranslating = false;
    };

    runTranslation();

    const observer = new MutationObserver(() => {
      runTranslation();
    });

    observer.observe(root, {
      childList: true,
      subtree: true,
      characterData: true,
      attributes: false,
    });

    return () => observer.disconnect();
  }, [language, replacements]);

  const value = useMemo<I18nContextValue>(
    () => ({
      language,
      setLanguage,
      toggleLanguage: () => setLanguage((current) => (current === 'tr' ? 'en' : 'tr')),
      t: (input: string) => translateWithPairs(input, replacements),
    }),
    [language, replacements]
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const context = useContext(I18nContext);

  if (!context) {
    throw new Error('useI18n must be used within I18nProvider');
  }

  return context;
}
