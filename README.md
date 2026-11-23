# فيول آب: ربط نماذج الموقع بـ Excel Online

يستقبل هذا الخادم نموذجي «تواصل معنا» و«اطلب عرضًا تشغيليًا» من موقع فيول آب. يضيف كل طلب كصف جديد في جدول `Website_Leads` داخل ملف Excel على OneDrive أو SharePoint، عبر Microsoft Graph من جهة الخادم فقط.

- **الأمان:**
  - لا توجد أي مفاتيح في الكود ولا في الموقع. كل بيانات الربط في متغيرات البيئة على Render.
  - كل نص يكتبه العميل يُحفظ كنص. لا تُنفَّذ صيغ Excel، ويبقى الصفر في بداية رقم الجوال.
- **إنشاء الطلب:**
  - يأخذ كل طلب رقمًا فريدًا متسلسلًا بالشكل `FA-2026-0001`.
  - الحالة تكون «جديد» تلقائيًا.
  - يُحفظ الوقت بتوقيت الرياض.
- **الطلبات المكررة:** لا يُحذف أي طلب مكرر.
- **تأكيد الحفظ:**
  - لا يرى العميل رسالة النجاح إلا بعد أن يؤكد Excel حفظ الصف.
  - إذا فشل الحفظ:
    - تظهر للعميل رسالة اعتذار.
    - تبقى بياناته في النموذج حتى يعيد المحاولة.
    - يُسجَّل الطلب كاملًا في سجل الخدمة على Render تحت `LEAD_NOT_SAVED` لاستعادته يدويًا.
- **الحماية من الإزعاج:**
  - حقل خفي (honeypot).
  - رفض الإرسال الأسرع من 2.5 ثانية.
  - 5 طلبات كحد أقصى لكل عنوان IP خلال 10 دقائق.
  - لا تُقبل الطلبات إلا من نطاقات الموقع المسموح بها.

## متغيرات البيئة (Render ← الخدمة ← Environment)

| المتغير | الوصف | مثال |
|---|---|---|
| `MS_TENANT_ID` | معرّف المستأجر (Directory/Tenant ID) في Microsoft Entra | `xxxxxxxx-xxxx-…` |
| `MS_CLIENT_ID` | معرّف التطبيق (Application/Client ID) | `xxxxxxxx-xxxx-…` |
| `MS_CLIENT_SECRET` | القيمة السرية للتطبيق (Client secret **Value**) | يُدخل في Render فقط |
| `MS_DRIVE_ID` | معرّف مساحة التخزين التي فيها الملف | يُستخرج بالأداة أدناه |
| `MS_ITEM_ID` | معرّف ملف Excel | يُستخرج بالأداة أدناه |
| `MS_TABLE_NAME` | اسم الجدول | `Website_Leads` |
| `ALLOWED_ORIGINS` | النطاقات المسموح لها بالإرسال | `https://fuelapp.sa,https://www.fuelapp.sa` |
| `DEMO_MODE` | `1` لوضع المعاينة بدون Excel. **احذفه عند الربط الفعلي** | `1` |
| `LEAD_ID_PREFIX` | اختياري. بادئة رقم الطلب | `FA` |
| `RATE_LIMIT_MAX` / `RATE_LIMIT_WINDOW_MIN` | اختياري. حد الطلبات لكل IP | `5` / `10` |

عند تعبئة متغيرات `MS_*` الخمسة يعمل الخادم في وضع `excel` تلقائيًا. يظهر الوضع الحالي في `GET /api/health`.

## خطوات ربط حساب Microsoft 365

### 1) ملف Excel
1. ارفع `Website_Leads_template.xlsx` إلى OneDrive للأعمال أو إلى مكتبة SharePoint، مثل موقع فريق المبيعات.
2. لا تغيّر اسم الجدول `Website_Leads` ولا أسماء الأعمدة. تغيير ترتيب الأعمدة مسموح.

### 2) تسجيل تطبيق في Microsoft Entra
يقوم بهذه الخطوات مسؤول تقنية المعلومات أو Global Admin.

1. افتح entra.microsoft.com، ثم App registrations، ثم New registration.
   - الاسم: `FuelApp Website Leads`.
   - نوع الحساب: Single tenant.
2. من صفحة Overview، انسخ:
   - Application (client) ID، وهو `MS_CLIENT_ID`.
   - Directory (tenant) ID، وهو `MS_TENANT_ID`.
3. من Certificates & secrets، اختر New client secret، ثم انسخ **Value** فورًا. هذا هو `MS_CLIENT_SECRET`.
4. من API permissions، اختر Add، ثم Microsoft Graph، ثم **Application permissions**، واختر إحدى الطريقتين:
   - **الأسهل:** `Files.ReadWrite.All`. يمنح التطبيق وصولًا لكل ملفات المؤسسة.
   - **الأكثر تقييدًا (موصى به مع SharePoint):** `Sites.Selected`. بعدها يمنح المسؤول التطبيق صلاحية `write` على موقع SharePoint الذي فيه الملف فقط، عبر:
     ```
     POST https://graph.microsoft.com/v1.0/sites/{site-id}/permissions
     {"roles":["write"],"grantedToIdentities":[{"application":{"id":"<MS_CLIENT_ID>","displayName":"FuelApp Website Leads"}}]}
     ```
     لتنفيذ هذا الطلب مرة واحدة يحتاج المسؤول إلى صلاحية `Sites.FullControl.All`، مثلًا من Graph Explorer.
5. اضغط **Grant admin consent**.

### 3) استخراج معرّفات الملف
1. افتح الملف في Excel Online، ثم Share، ثم Copy link.
2. من جهاز فيه Node 20 أو أحدث، شغّل:
   ```bash
   MS_TENANT_ID=… MS_CLIENT_ID=… MS_CLIENT_SECRET=… node tools/find-file.js "<رابط المشاركة>"
   ```
   يطبع الأمر `MS_DRIVE_ID` و`MS_ITEM_ID`، ويتأكد من وجود جدول `Website_Leads`.

### 4) التفعيل والاختبار
1. ضع المتغيرات في Render، واحذف `DEMO_MODE`، ثم اضغط Save. تُعاد تشغيل الخدمة تلقائيًا.
2. صف اختبار: شغّل `node tools/test-row.js` بالمتغيرات نفسها، أو أرسل النموذج من رابط المعاينة. يظهر صف بالحالة «اختبار» أو «جديد».
3. افتح `/api/health` وتأكد أن الوضع `"mode":"excel"`.

## الاختبارات
```bash
npm test
```
14 اختبارًا تعمل مقابل محاكٍ محلي لـ Microsoft Graph، ولا تحتاج حسابًا حقيقيًا. تغطي:
- ترقيم الطلبات، والطلبات المتزامنة.
- ربط الأعمدة بالاسم.
- التحقق من البيانات.
- الحقل الخفي (honeypot) وحد الطلبات.
- إعادة المحاولة عند 429 و503، وتجديد التوكن.
- الفشل الدائم دون ضياع الطلب.
