# SINH TỒN NGÀY TẬN THẾ — GAME H5

Game HTML5 Canvas 2D góc nhìn từ trên xuống, tiếng Việt, chạy offline. Không cần npm install, thư viện ngoài hoặc tài khoản. Mỗi ván gồm **bạn và ngẫu nhiên 15–20 AI**; cũng có thể chọn cố định từ 15 đến 20 tại màn hình đầu.

## Chơi ngay

1. Mở `CHOI-GAME.bat`, hoặc nhấp đúp `index.html` bằng Chrome / Edge / Firefox hiện đại.
2. Nhập tên, để “Ngẫu nhiên 15–20”, nhấn **BẮT ĐẦU SINH TỒN**.
3. Nhấp cây, đá, điểm nước, bụi quả để nhân vật tự đi thu thập. Nhấp quái để đi săn, kiếm Xu Quỷ.
4. Xây giếng, ruộng và tháp; bảo vệ Nhà chính qua các đêm.

Máy tính chỉ cần trình duyệt. Nếu muốn phục vụ qua HTTP và đã có Node.js 18 trở lên:

```text
node server.js
```

Sau đó mở http://127.0.0.1:8080. Máy chủ thử nghiệm chỉ lắng nghe loopback trên máy này. Dùng `PORT` để chọn cổng khác nếu cần. Có thể đưa các tệp `index.html`, `style.css`, `config.js`, `engine.js`, `game.js` lên máy chủ tĩnh H5 của bạn.

## Điều khiển

| Thao tác | Điều khiển |
|---|---|
| Di chuyển | WASD, phím mũi tên hoặc nhấp nền đất |
| Thu thập | Nhấp tài nguyên để tự đi thu; giữ E để thu gần |
| Chiến đấu | Nhấp quái để đuổi đánh; tự đánh trong tầm; Space đánh gần |
| Chọn công trình | Nhấp công trình để xem máu, cấp, chi phí, tác dụng và sửa/nâng cấp |
| Xây dựng | Các nút dưới màn hình, B chọn tường, phím 1–6 chọn loại |
| Đặt / hủy xây | Nhấp vị trí hợp lệ / chuột phải hoặc Esc |
| Về căn cứ | H hoặc nút hình nhà cạnh thanh máu |
| Quan sát bản đồ | M mở bản đồ; nhấp bản đồ nhỏ để xem căn cứ AI |
| Theo nhân vật | C hoặc “Về nhân vật” |
| Thu / phóng | Cuộn chuột |
| Bảng xếp hạng | L hoặc nút BXH |
| Tạm dừng | P / Esc hoặc nút Tạm dừng |

Thiết bị cảm ứng có các nút hướng, Thu và Đánh. Nhấp trên bản đồ vẫn dùng được. Khi sang ứng dụng khác, game tạm dừng để không mất căn cứ ngoài ý muốn.

## Tính năng

- 15–20 AI thật, tên và màu riêng, căn cứ ở các vị trí khác nhau. Cùng tồn tại, tranh tài nguyên; không tấn công nhau.
- AI tự di chuyển, ưu tiên nước/thực phẩm thấp, thu gỗ/đá, săn quái, rút lui khi ít máu, về căn cứ trước đêm, bảo vệ và sửa/nâng cấp/xây công trình bằng đúng tài nguyên của mình.
- Mỗi bên có Nhà chính, 11 đoạn tường và 1 cổng, 1 tháp cơ bản; khởi đầu 100 nước, 100 lương thực, 60 gỗ, 40 đá, 0 Xu Quỷ. Các vật ban đầu được cấp miễn phí như phần thiết lập ván.
- Ngày mặc định 180 giây, đêm 120 giây. Cảnh báo trước đêm 20 giây. Có thể chỉnh thời lượng khi bắt đầu.
- Tài nguyên có trữ lượng, tái sinh theo cấu hình (160 giây). Nước, thực phẩm giảm theo thời gian; thiếu làm chậm di chuyển và ngừng hồi máu, quá 20 giây mất máu dần (giữ tối thiểu 1 máu để người chơi có thể cứu vãn).
- Bảy loại công trình: Nhà chính, nhà ở, tường, cổng, tháp, ruộng, giếng. Mỗi loại có 5 cấp. Nhà chính có sẵn và chỉ nâng cấp; không thể xây thêm Nhà chính.
- Công trình mới xây trong 3 giây, chưa sản xuất hoặc bắn khi chưa hoàn tất. Mọi xây/nâng cấp đều cần Xu Quỷ; sửa dùng gỗ và đá, không vượt máu tối đa.
- Xem trước vị trí hợp lệ/không hợp lệ; không xây trùng công trình, tài nguyên (kể cả đang chờ tái sinh), nhân vật/quái hoặc ngoài khu vực.
- Va chạm tường/công trình; cổng chỉ cho chủ đi qua. Tìm đường lưới A* kết hợp di chuyển cục bộ; quái phá vật chắn đường trước khi đi tiếp.
- Quái thường, nhanh, trâu; máu, sát thương, số lượng tăng theo ngày. Quái từ rìa bản đồ, chia nhiều lượt sinh và chia mục tiêu cho tất cả căn cứ còn sống.
- Boss chung mỗi đêm ngày 7, 14, 21…; đòn diện rộng, thanh máu riêng, phần thưởng lớn. Lưu ngày đã tạo boss để tải lại không sinh trùng cùng đêm. Boss và quái còn sống tiếp tục tồn tại qua bình minh.
- Tháp bắn đạn thật; Xu Quỷ chỉ trao một lần cho bên kết liễu. Không chi tài nguyên khi thao tác không hợp lệ.
- Nhân vật gục ngã hồi sinh sau 10 giây nếu Nhà chính còn. Nhà chính bị phá sẽ loại chủ sở hữu; Nhà chính người chơi bị phá kết thúc ván.
- Lưu/tải toàn bộ ván, tự lưu 30 giây; xuất/nhập `.json` để chuyển máy. Có kiểm tra định dạng khi nhập.
- Giao diện co giãn theo màn hình, điều khiển cảm ứng, bản đồ nhỏ và bản đồ toàn khu vực.

## Bảng xếp hạng

**Trong ván:** hiển thị tất cả 16–21 bên, số ngày hoàn tất, quái/boss đã hạ, điểm. Ưu tiên bên còn sống, sau đó đến điểm, rồi máu Nhà chính.

**Kỷ lục trên máy:** lưu tối đa 30 ván của người chơi, cập nhật khi lưu hoặc kết thúc. Cùng một ván được cập nhật, không thêm bản trùng. Điểm = ngày hoàn tất × 120 + số quái hạ × 12 + số boss hạ × 800 + tổng cấp nâng thêm của công trình còn sống × 15. Boss cũng tính là một quái đã hạ. Chế độ kiểm tra không ghi kỷ lục.

BXH này **lưu cục bộ, chưa phải BXH online nhiều người**. Bộ nhớ phụ thuộc trình duyệt và nguồn mở trang: mở bằng `file://` và `http://127.0.0.1:8080` có vùng lưu khác nhau. Khi đổi trình duyệt, đổi vị trí thư mục, dọn dữ liệu hoặc dùng chế độ riêng tư, hãy xuất tệp trước. Tệp ván chơi không chứa bảng kỷ lục cũ.

## Cấu trúc và tùy chỉnh

| Tệp | Vai trò |
|---|---|
| `index.html` | Khung HTML5 tiếng Việt |
| `style.css` | Giao diện và điều khiển cảm ứng |
| `config.js` | Toàn bộ chỉ số, giá, cấp, thưởng, thời lượng, giới hạn |
| `engine.js` | Mô phỏng, AI, chiến đấu, đường đi, lưu/tải |
| `game.js` | Canvas, HUD, tương tác, bộ nhớ, BXH |
| `server.js` | Máy chủ tĩnh tùy chọn, không phụ thuộc thư viện |
| `tests/engine.test.js` | Bộ kiểm tra mô phỏng bằng Node.js |

Giới hạn mặc định: 260 quái sống, 50 công trình/bên, 500 viên đạn. Quái dư chờ trong hàng đợi, không sinh dồn gây giật. Tìm đường có giới hạn số ô xét để giữ tốc độ. Hình ảnh được vẽ bằng Canvas, không có tài nguyên tải ngoài.

## Kiểm tra

```text
node --test tests/engine.test.js
```

14 nhóm kiểm tra bao gồm số lượng AI, tài nguyên ban đầu, chi phí/va chạm/xây/nâng/sửa, trữ lượng/tái sinh, thưởng chỉ một lần, tháp gây sát thương, AI thu thập/đánh/xây/sửa, sóng quái theo căn cứ, một boss mỗi chu kỳ, đòn boss, lưu/tải/RNG, đói/khát, loại căn cứ, giới hạn thực thể và BXH.

**Đến nhanh đêm 7:** từ màn hình đầu mở “Tùy chỉnh thời lượng & chế độ kiểm tra”, đánh dấu chế độ kiểm tra, bắt đầu rồi nhấn F7; hoặc dùng nút trong menu tạm dừng. Không cấp miễn phí tài nguyên cho chế độ này. Mặc định tắt.

## Giới hạn hiện tại

- Chơi đơn trên trình duyệt; AI chạy trên máy. Chưa có tài khoản, máy chủ, multiplayer hay BXH online.
- Đồ họa Canvas đơn giản; chưa có âm thanh, hoạt ảnh sprite hoặc cốt truyện.
- AI dùng chiến thuật theo tình huống; công trình được điều khiển từ xa trong vùng căn cứ như người chơi. Tìm đường giới hạn số ô, có thể cần chọn lại đích ở các mê cung tường rất dày.
- Chưa cân bằng qua thử nghiệm dài hạn nhiều người, chưa kiểm tra trên thiết bị điện thoại thật; điều khiển cảm ứng đã được triển khai.
- Tệp lưu và kỷ lục cục bộ có thể được người dùng chỉnh; chưa có chống gian lận.

Phiên bản 1.0 · 19/10/2026.
