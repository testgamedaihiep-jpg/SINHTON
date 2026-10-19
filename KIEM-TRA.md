# Kết quả kiểm tra — 19/10/2026

## Mô phỏng bằng Node.js

Lệnh: `node --test tests/engine.test.js`.

**14/14 nhóm kiểm tra đạt.** Mô phỏng có seed cố định để lặp lại được; 80 seed bổ sung kiểm tra đủ sáu giá trị số lượng AI từ 15 đến 20.

- Số lượng/khởi tạo AI, căn cứ riêng, tài nguyên ban đầu.
- Xây hợp lệ trừ đúng tiền; vị trí sai không trừ; va chạm nhân vật, công trình, tài nguyên đang chờ tái sinh, rìa và vùng căn cứ.
- Xây chưa xong không sản xuất; năm cấp nâng; sửa không vượt máu tối đa.
- Trữ lượng/cooldown thu thập và tái sinh tài nguyên.
- Chỉ bên kết liễu nhận thưởng, chỉ một lần.
- Tường chặn chuyển động; chủ qua cổng, quái và chủ khác bị chặn.
- Đạn tháp gây sát thương thực tế.
- Sóng quái tăng theo ngày, hướng đến từng căn cứ; quái còn sau bình minh.
- Đúng một boss cho đêm 7, không sinh trùng khi khôi phục, còn sau bình minh.
- Boss đánh diện rộng và trao đúng gói thưởng một lần.
- AI di chuyển, thu tài nguyên, giết quái, sửa và xây có trả chi phí.
- Lưu/tải giữ nguyên tài nguyên, nhân vật, công trình, thời gian, hàng đợi, trạng thái boss và RNG; từ chối dữ liệu âm/sai định dạng.
- Đói/khát và loại người chơi khi mất Nhà chính.
- Giới hạn 260 quái, mô phỏng nhiều giai đoạn ngày/đêm, tài nguyên không âm, tọa độ hữu hạn và thứ tự BXH.

Kiểm tra cú pháp: `node --check engine.js`, `node --check game.js`, `node --check config.js`, `node --check server.js`.

## Trình duyệt

Kiểm tra trực tiếp bằng trình duyệt tích hợp, kích thước mặc định 1280×720:

- Trang HTTP trả về 200; màn hình bắt đầu và Canvas hiển thị.
- Bắt đầu ván ngẫu nhiên ra 20 AI / 21 bên; nhân vật, các công trình, tài nguyên, quái và bản đồ nhỏ hiển thị.
- Nhấp mỏ đá: nhân vật đi thu và lượng đá tăng từ 40 lên 94, sau đó lên 179.
- BXH hiện đủ 21 bên, AI có số quái đã hạ và hoạt động thu gỗ/đá/săn quái.
- Lưu ván, mở tab kỷ lục: có tên, 20 AI, số quái và điểm.
- Tải lại trang, tiếp tục ván: giữ tên, số AI, tài nguyên và đồng hồ.
- Menu tạm dừng có lưu/tải, nhập/xuất tệp và hướng dẫn.
- Bật chế độ kiểm tra qua giao diện, F7: chuyển tới đêm ngày 7, xuất hiện cảnh báo boss, thanh máu và mục tiêu là một AI.
- Không ghi nhận lỗi/warning console tại thời điểm kiểm tra ván thường.
- Kiểm tra bố cục 390×844: HUD, tài nguyên, BXH rút gọn, xây dựng, thanh máu và bản đồ không tràn ngang. Sau đó trả về kích thước mặc định.

Chưa kiểm tra trên điện thoại vật lý, chưa chạy thử tải nhiều người hoặc máy chủ BXH trực tuyến (bản này chơi đơn/offline).
