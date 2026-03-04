Neura Rest API
----

Neura Rest API adalah layanan resmi yang disediakan oleh Neura Sama untuk memenuhi berbagai kebutuhan terkait Toram Online dan lainnya. API ini dapat digunakan secara gratis dan cepat.

### Daftar Endpoint

| Endpoint                | Metode | Parameter Query                     | Status   |
|-------------------------|--------|-------------------------------------|----------|
| `/docs`                | GET    | Tidak ada                          | Tidak Aktif |
| `/api/toram/ava`             | GET    | Tidak ada                          | Aktif |
| `/api/toram/xtal/q=`         | GET    | `name`                             | Aktif |
| `/api/toram/ability/q=`      | GET    | `name`                             | Aktif |
| `/api/toram/item/q=`         | GET    | `name`                             | Aktif |
| `/api/etc/waifu`           | GET    | Tidak ada                          | Aktif       |
| `/api/etc/kerang/q=`           | GET    | `pertanyaan`                          | Aktif       |
| `/api/etc/khodam`          | GET    | Tidak ada                          | Tidak Aktif |
| `/api/toram/buff`            | GET    | Tidak ada                          | Tidak Aktif |
| `/api/toram/monster/q=&limit=` | GET  | `name: String`, `limit: Number`    | Tidak Aktif |
| `/api/toram/bosdif/q=`       | GET    | `name`                             | Tidak Aktif |
| `/api/etc/cuaca/q=`        | GET    | `desa/kabupaten`                   | Tidak Aktif |
| `/api/toram/regis/q=`        | GET    | `name`                             | Tidak Aktif |
| `/api/toram/appview/q=` | GET    | `name` | aktif |
| `spamadv/q=level=&exp=&max=&from=` | GET | `level`, `exp`, `max`, `form` | aktif |

### Catatan
- Data yang disediakan bersifat publik. Namun, harap mencantumkan sumber dengan menampilkan nama sumber pada hasil yang ditampilkan.

### Contoh Output
Berikut adalah contoh format output JSON yang dihasilkan oleh API:

```json
{
  "result": {
    "status": "success",
    "dev": "dimasyoag42",
    "source": "Neura Api Official",
    "version": 1.0,
    "message": "Pesan berhasil",
    "data": []
  }
}
```
