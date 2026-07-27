# Facebook Post Bot — Theo dõi tiến độ

Cập nhật lần cuối: 27/07/2026

---

# 1. Mục tiêu dự án

Xây dựng một bot đăng bài tuyển dụng lên nhiều Facebook Group.

Bot chỉ chạy khi người dùng chủ động nhập lệnh trong Terminal.

Bot sử dụng browser automation được viết bằng code cố định, không sử dụng AI để:

- Nhìn giao diện Facebook.
- Tự suy luận vị trí nút.
- Tự quyết định thao tác.
- Tự tạo nội dung.
- Tự thay đổi JD.

Nội dung JD được lấy từ Supabase.

Ảnh tuyển dụng được lưu trực tiếp trong GitHub repository và được gắn với từng vị trí tuyển dụng.

---

# 2. Flow hiện tại

Flow hoàn chỉnh hiện tại:

Người dùng nhập JD vào Supabase
        ↓
JD có STT và position
        ↓
JD được gắn với danh sách Facebook Group
        ↓
Người dùng chạy một command trong Terminal
        ↓
Bot lấy JD từ Supabase
        ↓
Bot lấy ảnh tương ứng với position từ repo
        ↓
Bot lấy danh sách group đã gắn với JD
        ↓
Bot mở Chrome profile Facebook riêng
        ↓
Bot mở group đầu tiên
        ↓
Bot mở giao diện tạo bài viết
        ↓
Bot điền nội dung JD
        ↓
Bot upload ảnh
        ↓
Bot tìm nút Đăng
        ↓
Bot tự bấm Đăng
        ↓
Bot xác nhận composer đã đóng hoặc bài đang chờ duyệt
        ↓
Bot lưu group đã hoàn thành
        ↓
Bot đóng Chrome
        ↓
Bot tự chuyển sang group tiếp theo
        ↓
Lặp lại đến hết danh sách group
3. Nguyên tắc vận hành
Bot chỉ chạy khi người dùng nhập command.
Không có scheduler tự chạy ngầm.
Không có AI tham gia vào browser flow.
Không lưu mật khẩu Facebook trong code.
Không tự xử lý OTP.
Không tự xử lý CAPTCHA.
Không tự xử lý Facebook checkpoint.
Chrome Facebook dùng profile riêng.
Flow Facebook không dùng chung browser profile với flow khác.
Một thời điểm chỉ có một Facebook posting job được chạy.
Nếu batch bị dừng, lần chạy tiếp theo sẽ tiếp tục từ group chưa hoàn thành.
Nếu group đã hoàn thành, bot sẽ bỏ qua để tránh đăng trùng.
4. Kiến trúc hiện tại
GitHub Repository
├── Source code
├── Playwright automation
├── Position image mapping
├── Recruitment images
└── Progress documentation

Supabase
├── Facebook post / JD data
├── Facebook Group list
└── JD → Group relationships

Mac local
├── Node.js
├── Playwright
├── Dedicated Chrome profile
├── Runtime lock
└── Local progress tracking
5. Nơi chạy hệ thống
Bot hiện chạy local trên Mac.
Đường dẫn repo local:

~/Desktop/facebook-group-posting
Lệnh vào repo:
cd ~/Desktop/facebook-group-posting
Railway chưa được sử dụng trong flow hiện tại.
Railway có thể được thêm sau để làm:

Dashboard.
Quản lý JD.
Quản lý group.
Theo dõi lịch sử đăng.
Quản lý queue.
Điều khiển local worker.
6. Công nghệ đang sử dụng
Node.js 22
JavaScript ES Module
Playwright Core
Google Chrome
Supabase PostgreSQL
Supabase JavaScript Client
dotenv
Git
GitHub
macOS Terminal
7. Trạng thái tổng thể
Current overall progress: 98%
Giai đoạn	Trạng thái	Tiến độ
Phase 1 — Local Facebook posting bot	Gần hoàn thành	98%
Phase 2 — Dashboard và quản lý dữ liệu	Chưa bắt đầu	0%
Phase 3 — Railway backend và remote queue	Chưa bắt đầu	0%
Phase 4 — Logging, monitoring và báo cáo nâng cao	Chưa bắt đầu	0%
98% được sử dụng vì các chức năng chính đã được viết và test riêng lẻ, nhưng vẫn cần test batch thực tế trên nhiều group liên tục để xác nhận toàn bộ flow ổn định.
8. Phase 1 — Local Facebook Posting Bot
Mục tiêu Phase 1
Nhận một STT của JD, sau đó tự động:
Lấy JD từ Supabase.
Xác định vị trí tuyển dụng.
Lấy đúng ảnh tuyển dụng từ repo.
Lấy danh sách group đã gán với JD.
Mở từng group.
Điền JD.
Upload ảnh.
Bấm Đăng.
Ghi nhận progress.
Chuyển sang group tiếp theo.
9. Step 1 — Chốt logic bot
Mục tiêu
Xác định bot sẽ chạy theo command và không sử dụng AI.
Những việc đã hoàn thành
 Bot chỉ chạy khi người dùng nhập command.
 Không sử dụng AI để điều khiển Facebook.
 Không dùng AI để tìm nút.
 Không dùng AI để phân tích nội dung.
 Không có lịch tự chạy.
 Browser flow được viết cố định bằng Playwright.
 Bot chạy local trên Mac.
 GitHub dùng để lưu code.
 Supabase dùng để lưu JD và group.
 Railway được hoãn sang giai đoạn sau.
Step progress: 100%
10. Step 2 — Tạo GitHub repository
Mục tiêu
Tạo repository riêng để lưu code và theo dõi thay đổi.
Những việc đã hoàn thành
 GitHub repository được tạo.
 Repository được clone về Mac.
 Đã xác định lỗi folder tải ZIP không có .git.
 Đã clone lại repository bằng git clone.
 Local repo đã kết nối với origin/main.
 git pull origin main hoạt động.
 git push origin main hoạt động.
 Repo local có thể cập nhật code từ GitHub.
 Repo local có thể push code ngược lên GitHub.
Repo local:
~/Desktop/facebook-group-posting
Step progress: 100%
11. Step 3 — Khởi tạo Node.js project
Mục tiêu
Tạo project Node.js có thể chạy Playwright và Supabase client.
Những việc đã hoàn thành
 package.json được tạo.
 Project dùng ES Module.
 Node.js version yêu cầu từ 20 trở lên.
 Node.js local đang dùng version 22.
 playwright-core được cài.
 @supabase/supabase-js được cài.
 dotenv được cài.
 package-lock.json được tạo.
 node_modules được cài local.
 node_modules không được push lên GitHub.
Các package chính:
playwright-core
@supabase/supabase-js
dotenv
Step progress: 100%
12. Step 4 — Tạo .gitignore
Mục tiêu
Ngăn dữ liệu local và dữ liệu nhạy cảm bị push lên GitHub.
Những thứ đã được ignore
 node_modules/
 .env
 Local group JSON cũ.
 Local post JSON cũ.
 Log files.
 Runtime lock.
 Local progress.
 Playwright test outputs.
 .DS_Store
 Editor settings.
 Temporary files.
Step progress: 100%
13. Step 5 — Tạo cấu hình môi trường
Mục tiêu
Kết nối local repo với Supabase mà không hard-code key.
File local
.env
Các biến chính
SUPABASE_URL=...
SUPABASE_KEY=...
SUPABASE_POSTS_TABLE=facebook_posts
Những việc đã hoàn thành
 .env được tạo local.
 Supabase URL được cấu hình.
 Supabase key được cấu hình.
 Table name được cấu hình.
 .env không được push lên GitHub.
 Source code không chứa Supabase key thật.
Step progress: 100%
14. Step 6 — Tạo Chrome profile riêng
Mục tiêu
Tách Facebook browser khỏi Chrome cá nhân và các automation flow khác.
Profile hiện tại
~/.hermes/browser-profiles/facebook
Những việc đã làm
 Tạo profile Chrome riêng.
 Ban đầu đã thử CDP port 9223.
 CDP endpoint trả kết quả thành công.
 Phát hiện lỗi Playwright connectOverCDP.
 Lỗi CDP là Browser context management is not supported.
 Quyết định bỏ cách kết nối CDP.
 Chuyển sang launchPersistentContext.
 Playwright trực tiếp mở Chrome profile riêng.
 Cookies Facebook được giữ trong persistent profile.
 Flow khác không sử dụng profile này.
 Không sử dụng Chrome profile cá nhân.
Lưu ý:
CDP port 9223 không còn là phần bắt buộc trong flow hiện tại.

Step progress: 100%

15. Step 7 — Tạo src/browser.js
Mục tiêu
Quản lý browser Facebook riêng.
Những việc đã hoàn thành
 Mở Google Chrome bằng Playwright.
 Dùng persistent profile.
 Chạy headless: false.
 Chrome hiển thị thật trên màn hình.
 Giữ cookie đăng nhập.
 Mở tab automation.
 Test mở example.com.
 Xử lý lỗi profile đang được sử dụng.
 Không sử dụng Chrome của flow khác.
 Có thể đóng Chrome context sau khi hoàn thành job.
File:
src/browser.js
Step progress: 100%
16. Step 8 — Kiểm tra Facebook session
Mục tiêu
Xác định tài khoản Facebook đã đăng nhập hay chưa.
Những việc đã hoàn thành
 Mở Facebook homepage.
 Phát hiện login page.
 Phát hiện password field.
 Phát hiện checkpoint URL.
 Phát hiện verification page.
 Phát hiện session đang hoạt động.
 Không tự nhập password.
 Không tự nhập OTP.
 Không tự xử lý checkpoint.
 Cho phép người dùng login thủ công.
File:
src/facebook-session.js
Step progress: 100%
17. Step 9 — Cấu trúc dữ liệu Supabase
Mục tiêu
Lưu JD và danh sách Facebook Group trên Supabase.
Table facebook_posts
Các cột chính:
id
stt
position
jd
created_at
Ý nghĩa:
id: ID kỹ thuật.
stt: số thứ tự để gọi bot.
position: mã vị trí tuyển dụng.
jd: nội dung đăng Facebook.
created_at: thời gian tạo.
Ví dụ:
stt: 1
position: content-creator
jd: Nội dung tuyển dụng Content Creator
Table facebook_groups
Các cột chính:
id
group_key
name
url
enabled
created_at
Ý nghĩa:
group_key: mã nội bộ như group-01.
name: tên Facebook Group.
url: link group.
enabled: group có được bot sử dụng không.
Table facebook_post_groups
Các cột chính:
post_id
group_id
created_at
Table này dùng để gắn:
Một JD
→ nhiều Facebook Group
Những việc đã hoàn thành
 JD được lưu trong Supabase.
 Position được lưu trong Supabase.
 Danh sách group được chuyển từ JSON lên Supabase.
 Bảng nối JD với group được tạo.
 JD Content Creator được gắn với 17 group.
 Group trùng URL được loại bỏ.
 group-02 và group-10 từng trùng URL.
 Danh sách cuối có 17 group duy nhất.
 Group có thể bật/tắt bằng enabled.
Step progress: 100%
18. Step 10 — Đọc JD từ Supabase
Mục tiêu
Nhận một STT và lấy đúng JD.
File
src/supabase.js
Những việc đã hoàn thành
 Kết nối Supabase bằng environment variables.
 Không hard-code Supabase key.
 Nhận stt.
 Query table facebook_posts.
 Lấy id.
 Lấy stt.
 Lấy position.
 Lấy jd.
 Validate STT là số nguyên dương.
 Báo lỗi khi STT không tồn tại.
 Báo lỗi khi JD trống.
 Báo lỗi khi position trống.
 Test đọc JD thành công.
Command test:
node src/supabase.js 1
Step progress: 100%
19. Step 11 — Lưu ảnh theo vị trí trong repo
Mục tiêu
Mỗi vị trí tuyển dụng tương ứng với một ảnh.
Ảnh không lưu trên Supabase.

Cấu trúc
assets/
└── positions/
    ├── content-creator.jpg
    ├── motion-designer.jpg
    └── ...
File mapping
data/positions.json
Ví dụ:
{
  "id": "content-creator",
  "name": "Content Creator",
  "image": "assets/positions/content-creator.jpg",
  "enabled": true
}
Những việc đã hoàn thành
 Thư mục ảnh được tạo.
 Ảnh Content Creator được thêm.
 positions.json được tạo.
 Position ID khớp với Supabase.
 Mỗi position có đúng một ảnh.
 Đường dẫn ảnh được lưu trong JSON.
 Ảnh được push lên GitHub.
Step progress: 100%
20. Step 12 — Tạo src/positions.js
Mục tiêu
Nhận position và tìm đúng ảnh trong repo.
Những việc đã hoàn thành
 Đọc positions.json.
 Validate cấu trúc JSON.
 Validate position ID.
 Chặn position trùng ID.
 Chặn position bị disabled.
 Tìm đúng ảnh.
 Chuyển đường dẫn tương đối thành đường dẫn tuyệt đối.
 Kiểm tra file ảnh tồn tại.
 Báo lỗi khi ảnh bị thiếu.
 Test mapping position thành công.
Command test:
node src/positions.js content-creator
Step progress: 100%
21. Step 13 — Tạo src/post-data.js
Mục tiêu
Gộp JD và ảnh thành một object duy nhất.
Flow
STT
→ đọc Supabase
→ lấy position
→ đọc positions.json
→ lấy đúng ảnh
→ trả dữ liệu hoàn chỉnh
Output
id
stt
jd
position.id
position.name
image.relativePath
image.absolutePath
Những việc đã hoàn thành
 Đọc JD theo STT.
 Lấy position.
 Map position sang ảnh.
 Kiểm tra ảnh tồn tại.
 Trả object hoàn chỉnh.
 Test thành công với STT 1.
Command test:
node src/post-data.js 1
Step progress: 100%
22. Step 14 — Đọc danh sách group theo JD
Mục tiêu
Nhận một STT và lấy toàn bộ group đã gắn với JD đó.
File
src/post-groups.js
Những việc đã hoàn thành
 Tìm post theo STT.
 Lấy post ID.
 Query bảng facebook_post_groups.
 Join với facebook_groups.
 Lấy group_key.
 Lấy tên group.
 Lấy URL group.
 Lọc group disabled.
 Sắp xếp group theo group_key.
 Trả đúng 17 group.
 Báo lỗi nếu JD không có group.
Command test:
node src/post-groups.js 1
Step progress: 100%
23. Step 15 — Mở Facebook Group
Mục tiêu
Mở đúng Facebook Group từ URL.
File
src/open-group.js
Những việc đã hoàn thành
 Đọc group.
 Mở Chrome profile riêng.
 Mở URL group.
 Chờ trang load.
 Giữ browser mở để kiểm tra.
 Test mở group thành công.
Step progress: 100%
24. Step 16 — Mở composer
Mục tiêu
Click vào vùng tạo bài viết trong Facebook Group.
File
src/open-composer.js
Selector ban đầu
Bot ban đầu tìm các text:
Viết gì đó
Tạo bài viết
Bạn đang nghĩ gì
Write something
Create post
What's on your mind
Lỗi gặp phải
Giao diện thực tế hiển thị:
Bạn viết gì đi...
Do selector chưa có text này nên bot mở đúng group nhưng không mở được composer.
Cách đã sửa
 Bổ sung selector Bạn viết gì đi.
 Ưu tiên tìm element có role="button".
 Không chỉ click text node.
 Hỗ trợ tiếng Việt.
 Hỗ trợ tiếng Anh.
 Chờ composer dialog mở.
 Tìm editor trong dialog.
 Test composer mở thành công.
Ngoài ra:
 File có thể nhận group từ JSON cũ.
 File có thể nhận group object từ Supabase.
 Flow Supabase không còn phụ thuộc vào data/groups.json.
Step progress: 100%
25. Step 17 — Điền nội dung JD
Mục tiêu
Điền nguyên văn nội dung JD vào Facebook composer.
Những việc đã hoàn thành
 Click editor.
 Điền JD bằng Playwright.
 Giữ tiếng Việt.
 Giữ xuống dòng.
 Đọc lại nội dung sau khi điền.
 Normalize line ending.
 So sánh content thực tế với content Supabase.
 Báo lỗi nếu content khác.
 Test content được điền thành công.
Step progress: 100%
26. Step 18 — Upload ảnh
Mục tiêu
Upload đúng ảnh theo position vào composer.
Những việc đã hoàn thành
 Lấy đường dẫn ảnh tuyệt đối.
 Tìm input[type="file"].
 Ưu tiên input nhận image.
 Upload bằng setInputFiles.
 Chờ Facebook xử lý ảnh.
 Tìm preview dạng blob.
 Tìm preview từ Facebook CDN.
 Tìm background-image preview.
 Timeout tối đa 120 giây.
 Không tiếp tục nếu không xác nhận được preview.
 Test ảnh Content Creator hiển thị thành công.
Step progress: 100%
27. Step 19 — Chọn group theo số thứ tự
Mục tiêu
Cho phép test riêng từng group.
Command
node src/prepare-post.js 1 1
Ý nghĩa:
STT 1
Group thứ 1
Ví dụ group thứ hai:
node src/prepare-post.js 1 2
Những việc đã hoàn thành
 Nhận STT.
 Nhận group number.
 Validate group number.
 Chuyển group number sang array index.
 Báo lỗi nếu group number vượt danh sách.
 Hiển thị group hiện tại.
 Hiển thị tổng số group.
 Test group 1.
 Test group 2.
Step progress: 100%
28. Step 20 — Job lock
Mục tiêu
Ngăn hai job cùng điều khiển Chrome Facebook.
File
src/job-lock.js
Runtime lock
runtime/facebook-post.lock
Những việc đã hoàn thành
 Tạo lock khi job bắt đầu.
 Lưu process ID.
 Lưu STT.
 Lưu group number.
 Lưu thời gian bắt đầu.
 Chặn job thứ hai.
 Báo PID của job đang chạy.
 Xóa lock khi job hoàn thành.
 Xóa lock khi job lỗi được xử lý.
 Xử lý stale lock.
 Có command kill process thủ công.
 Có command xóa lock thủ công.
Command đóng bot:
kill <PID>
Nếu process không dừng:
kill -9 <PID>
Xóa lock:
rm -f runtime/facebook-post.lock
Đóng Chrome bot:
pkill -f "$HOME/.hermes/browser-profiles/facebook"
Step progress: 100%
29. Step 21 — Sửa lỗi CLI không chạy
Lỗi gặp phải
Command:
node src/prepare-post.js 1 1
thoát ngay và không mở browser.
Nguyên nhân
Đoạn kiểm tra direct execution không gọi function run() đúng cách.
Cách đã sửa
Chuyển sang so sánh:
import.meta.url
với:
pathToFileURL(path.resolve(process.argv[1])).href
Kết quả
 File nhận đúng command.
 run() được gọi.
 Job lock được tạo.
 Browser mở.
 JD được điền.
 Ảnh được upload.
Step progress: 100%
30. Step 22 — Progress tracking
Mục tiêu
Lưu danh sách group đã hoàn thành để tránh đăng trùng.
File code
src/post-progress.js
File dữ liệu local
runtime/post-progress.json
Dữ liệu lưu
STT
Danh sách group đã hoàn thành
Group number cuối
Thời gian cập nhật
Những việc đã hoàn thành
 Tạo progress file tự động.
 Đọc progress theo STT.
 Mark group đã hoàn thành.
 Không thêm group trùng.
 Lưu lastGroupNumber.
 Lưu updatedAt.
 Reset progress.
 File progress không push lên GitHub.
 Dùng temporary file trước khi rename.
 Test mark group 1.
 Test mark group 2.
 Test reset progress.
Command xem trạng thái:
node src/post-progress.js status 1
Command reset:
node src/post-progress.js reset 1
Step progress: 100%
31. Step 23 — Chế độ next
Mục tiêu
Không cần tự nhớ group number.
Command
node src/prepare-post.js 1 next
Flow
Đọc progress
→ lấy danh sách group
→ tìm group đầu tiên chưa hoàn thành
→ chuẩn bị hoặc đăng bài
→ mark progress
Những việc đã hoàn thành
 Đọc progress.
 Chuyển danh sách đã hoàn thành thành Set.
 Tìm group chưa hoàn thành đầu tiên.
 Chọn đúng group tiếp theo.
 Báo lỗi khi tất cả group đã hoàn thành.
 Cho phép reset để chạy lại.
 Hiển thị x/17.
Step progress: 100%
32. Step 24 — Tự động bấm nút Đăng
Mục tiêu
Bot tự bấm Post sau khi content và ảnh đã sẵn sàng.
Những việc đã hoàn thành
 Tìm button có tên Đăng.
 Tìm button có tên Post.
 Tìm button bằng role.
 Tìm button bằng aria-label.
 Tìm button trong composer dialog.
 Tìm button trên toàn page nếu cần.
 Chờ button sẵn sàng.
 Không click button bị ẩn.
 Kiểm tra aria-disabled.
 Kiểm tra native disabled.
 Kiểm tra button có kích thước thật.
 Click button Post.
 Chờ composer đóng.
 Phát hiện bài đang chờ duyệt.
 Phát hiện Facebook error message.
 Không update progress nếu không xác nhận được kết quả.
Lỗi đã gặp
Facebook hiển thị nút Đăng màu xanh nhưng code báo disabled.
Nguyên nhân
Có thể Facebook có nhiều element cùng chữ Đăng.
Code cũ lấy element đầu tiên và chọn nhầm button ẩn hoặc button chưa active.

Cách đã sửa
Bot duyệt toàn bộ candidate và chỉ chọn button:
đang hiển thị
có kích thước thật
aria-disabled không phải true
native disabled không phải true
Step progress: 95%
Phần cần xác nhận thêm:

 Test lại auto-click Post sau selector mới.
 Xác nhận composer đóng sau khi đăng.
 Xác nhận progress được ghi đúng.
33. Step 25 — Batch chạy toàn bộ group
Mục tiêu
Chạy toàn bộ group bằng một command.
File
src/prepare-all.js
Command
node src/prepare-all.js 1
Flow
Đọc STT
→ lấy 17 group
→ đọc progress
→ bỏ qua group đã hoàn thành
→ xử lý group còn lại
→ group 1
→ group 2
→ group 3
→ ...
→ group 17
Những việc đã hoàn thành
 Nhận STT.
 Lấy toàn bộ group.
 Đọc progress hiện tại.
 Bỏ qua group đã hoàn thành.
 Chạy tuần tự từng group.
 Không chạy nhiều browser song song.
 Dừng batch nếu một group lỗi.
 Hiển thị group bị lỗi.
 Cho phép chạy lại command.
 Tiếp tục từ group chưa hoàn thành.
 Dùng job lock cho toàn batch.
 Hiển thị batch progress.
 Báo khi toàn bộ group hoàn thành.
Command tiếp tục batch:
node src/prepare-all.js 1
Command chạy lại từ đầu:
node src/post-progress.js reset 1
rm -f runtime/facebook-post.lock
pkill -f "$HOME/.hermes/browser-profiles/facebook"
node src/prepare-all.js 1
Step progress: 95%
Phần còn cần test:

 Auto-post thành công ở group đầu tiên.
 Bot tự đóng Chrome.
 Bot tự mở group tiếp theo.
 Test liên tục ít nhất 2–3 group.
 Test batch đủ 17 group.
34. Các file hiện có
facebook-group-posting/
│
├── package.json
├── package-lock.json
├── .gitignore
├── .env.example
├── README.md
│
├── src/
│   ├── browser.js
│   ├── facebook-session.js
│   ├── groups.js
│   ├── job-lock.js
│   ├── open-composer.js
│   ├── open-group.js
│   ├── positions.js
│   ├── post-data.js
│   ├── post-groups.js
│   ├── post-progress.js
│   ├── prepare-post.js
│   ├── prepare-all.js
│   └── supabase.js
│
├── data/
│   └── positions.json
│
├── assets/
│   └── positions/
│       └── content-creator.jpg
│
├── runtime/
│   ├── facebook-post.lock
│   └── post-progress.json
│
├── supabase/
│   ├── groups-schema.sql
│   └── groups-seed.sql
│
└── docs/
    └── PROGRESS.md
Lưu ý:
Các file trong runtime/ chỉ xuất hiện khi bot chạy và không được push lên GitHub.

35. Command sử dụng hằng ngày
Vào repo
cd ~/Desktop/facebook-group-posting
Kiểm tra syntax
node --check src/prepare-post.js
node --check src/prepare-all.js
node --check src/job-lock.js
node --check src/post-progress.js
Test một group cụ thể
node src/prepare-post.js 1 1
Chạy group tiếp theo
node src/prepare-post.js 1 next
Chạy toàn bộ group
node src/prepare-all.js 1
Xem progress
node src/post-progress.js status 1
Reset progress
node src/post-progress.js reset 1
Xóa lock
rm -f runtime/facebook-post.lock
Đóng Chrome bot
pkill -f "$HOME/.hermes/browser-profiles/facebook"
Đóng process bot theo PID
kill <PID>
Nếu không dừng:
kill -9 <PID>
Chạy lại toàn bộ từ đầu
cd ~/Desktop/facebook-group-posting
node src/post-progress.js reset 1
rm -f runtime/facebook-post.lock
pkill -f "$HOME/.hermes/browser-profiles/facebook"
node src/prepare-all.js 1
36. Trạng thái chức năng
Chức năng	Trạng thái
Repo GitHub	100%
Node.js project	100%
Playwright setup	100%
Supabase connection	100%
Đọc JD theo STT	100%
Lấy position	100%
Map position sang ảnh	100%
Đọc danh sách group	100%
Một JD gắn nhiều group	100%
Mở Chrome profile riêng	100%
Mở Facebook Group	100%
Mở composer	100%
Điền JD	100%
Upload ảnh	100%
Chọn group theo số	100%
Chế độ next	100%
Job lock	100%
Progress tracking	100%
Tìm nút Đăng	100%
Click nút Đăng	95%
Xác nhận đăng thành công	95%
Chạy batch nhiều group	95%
Test đủ 17 group	0%
37. Việc còn lại
Việc 1 — Test auto-post sau selector mới
Chạy:
node src/post-progress.js reset 1
rm -f runtime/facebook-post.lock
pkill -f "$HOME/.hermes/browser-profiles/facebook"
node src/prepare-post.js 1 1
Điều kiện đạt:
Nút Đăng được tìm thấy.
Bot tự click.
Composer đóng.
Terminal báo submitted hoặc pending_approval.
Progress thành 1/17.
Chrome đóng.
Process kết thúc.
Việc 2 — Test batch 2–3 group
Chạy:
node src/prepare-all.js 1
Điều kiện đạt:
Group 1 được đăng.
Bot đóng browser.
Bot tự mở group 2.
Group 2 được đăng.
Bot tự mở group 3.
Progress tăng đúng.
Việc 3 — Test đủ danh sách
Sau khi test 2–3 group ổn định, chạy toàn bộ 17 group.
Việc 4 — Cập nhật log lỗi thực tế
Ghi lại các group có:
Không cho đăng.
Bắt chọn topic.
Bắt xác nhận nội quy.
Bài phải chờ duyệt.
Composer khác giao diện.
Nút Đăng có cấu trúc khác.
Không còn là thành viên.
38. Điều kiện Phase 1 đạt 100%
Phase 1 được xem là hoàn thành khi:
 Bot đọc đúng JD.
 Bot lấy đúng ảnh.
 Bot lấy đúng danh sách group.
 Bot mở đúng group.
 Bot mở đúng composer.
 Bot điền đúng content.
 Bot upload đúng ảnh.
 Bot tự bấm Đăng ổn định.
 Bot xác nhận kết quả đăng.
 Bot lưu progress sau khi đăng.
 Bot tự chuyển sang group tiếp theo.
 Batch chạy ổn định ít nhất 2–3 group.
 Test đầy đủ 17 group.
Current Phase 1 progress: 98%
39. Changelog
27/07/2026
Chốt bot chạy bằng command.
Loại bỏ AI khỏi browser automation.
Tạo GitHub repository.
Clone repo về Mac.
Khởi tạo Node.js project.
Cài Playwright Core.
Tạo .gitignore.
Tạo cấu hình environment.
Tạo Chrome profile riêng.
Thử kết nối Chrome bằng CDP port 9223.
Phát hiện lỗi connectOverCDP.
Chuyển sang persistent Chrome context.
Test mở browser thành công.
Tạo Supabase table cho JD.
Tạo Supabase table cho Facebook Group.
Tạo bảng nối JD với group.
Import danh sách group.
Loại bỏ group trùng URL.
Gắn JD Content Creator với 17 group.
Lưu ảnh Content Creator trong GitHub.
Tạo position image mapping.
Tạo Supabase data loader.
Tạo position resolver.
Gộp JD và ảnh.
Đọc danh sách group theo STT.
Mở Facebook Group.
Kiểm tra Facebook session.
Mở composer.
Sửa selector theo text Bạn viết gì đi....
Điền JD thành công.
Upload ảnh thành công.
Tạo group number selection.
Tạo job lock.
Sửa lỗi CLI không gọi run().
Tạo progress tracking.
Tạo chế độ next.
Tạo batch chạy toàn bộ group.
Thêm logic tự tìm nút Đăng.
Phát hiện lỗi chọn nhầm button disabled.
Update logic tìm button đang hiển thị và enabled.
Chuẩn bị command chạy toàn bộ danh sách.
40. Current work
Current step:
Test auto-post và batch tuần tự
Current objective:
Xác nhận bot tự click Đăng thành công,
đóng browser,
ghi progress,
và tự chuyển sang group tiếp theo.
Current blocker:
Cần test lại selector nút Đăng vừa được update.
Next action:
cd ~/Desktop/facebook-group-posting
node src/post-progress.js reset 1
rm -f runtime/facebook-post.lock
pkill -f "$HOME/.hermes/browser-profiles/facebook"
node src/prepare-post.js 1 1

đùa viết hết thành 1 file text chứ

facebook-post-bot-progress.txt 

Library
/
facebook-post-bot-progress.txt


# Facebook Post Bot — Theo dõi tiến độ

Cập nhật lần cuối: 27/07/2026

---

# 1. Mục tiêu dự án

Xây dựng một bot đăng bài tuyển dụng lên nhiều Facebook Group.

Bot chỉ chạy khi người dùng chủ động nhập lệnh trong Terminal.

Bot sử dụng browser automation được viết bằng code cố định, không sử dụng AI để:

- Nhìn giao diện Facebook.
- Tự suy luận vị trí nút.
- Tự quyết định thao tác.
- Tự tạo nội dung.
- Tự thay đổi JD.

Nội dung JD được lấy từ Supabase.

Ảnh tuyển dụng được lưu trực tiếp trong GitHub repository và được gắn với từng vị trí tuyển dụng.

---

# 2. Flow hiện tại

Flow hoàn chỉnh hiện tại:

Người dùng nhập JD vào Supabase
        ↓
JD có STT và position
        ↓
JD được gắn với danh sách Facebook Group
        ↓
Người dùng chạy một command trong Terminal
        ↓
Bot lấy JD từ Supabase
        ↓
Bot lấy ảnh tương ứng với position từ repo
        ↓
Bot lấy danh sách group đã gắn với JD
        ↓
Bot mở Chrome profile Facebook riêng
        ↓
Bot mở group đầu tiên
        ↓
Bot mở giao diện tạo bài viết
        ↓
Bot điền nội dung JD
        ↓
Bot upload ảnh
        ↓
Bot tìm nút Đăng
        ↓
Bot tự bấm Đăng
        ↓
Bot xác nhận composer đã đóng hoặc bài đang chờ duyệt
        ↓
Bot lưu group đã hoàn thành
        ↓
Bot đóng Chrome
        ↓
Bot tự chuyển sang group tiếp theo
        ↓
Lặp lại đến hết danh sách group

---

# 3. Nguyên tắc vận hành

- Bot chỉ chạy khi người dùng nhập command.
- Không có scheduler tự chạy ngầm.
- Không có AI tham gia vào browser flow.
- Không lưu mật khẩu Facebook trong code.
- Không tự xử lý OTP.
- Không tự xử lý CAPTCHA.
- Không tự xử lý Facebook checkpoint.
- Chrome Facebook dùng profile riêng.
- Flow Facebook không dùng chung browser profile với flow khác.
- Một thời điểm chỉ có một Facebook posting job được chạy.
- Nếu batch bị dừng, lần chạy tiếp theo sẽ tiếp tục từ group chưa hoàn thành.
- Nếu group đã hoàn thành, bot sẽ bỏ qua để tránh đăng trùng.

---

# 4. Kiến trúc hiện tại

GitHub Repository
├── Source code
├── Playwright automation
├── Position image mapping
├── Recruitment images
└── Progress documentation

Supabase
├── Facebook post / JD data
├── Facebook Group list
└── JD → Group relationships

Mac local
├── Node.js
├── Playwright
├── Dedicated Chrome profile
├── Runtime lock
└── Local progress tracking

---

# 5. Nơi chạy hệ thống

Bot hiện chạy local trên Mac.

Đường dẫn repo local:

~/Desktop/facebook-group-posting

Lệnh vào repo:

cd ~/Desktop/facebook-group-posting

Railway chưa được sử dụng trong flow hiện tại.

Railway có thể được thêm sau để làm:

- Dashboard.
- Quản lý JD.
- Quản lý group.
- Theo dõi lịch sử đăng.
- Quản lý queue.
- Điều khiển local worker.

---

# 6. Công nghệ đang sử dụng

- Node.js 22
- JavaScript ES Module
- Playwright Core
- Google Chrome
- Supabase PostgreSQL
- Supabase JavaScript Client
- dotenv
- Git
- GitHub
- macOS Terminal

---

# 7. Trạng thái tổng thể

Current overall progress: 98%

| Giai đoạn | Trạng thái | Tiến độ |
|---|---|---:|
| Phase 1 — Local Facebook posting bot | Gần hoàn thành | 98% |
| Phase 2 — Dashboard và quản lý dữ liệu | Chưa bắt đầu | 0% |
| Phase 3 — Railway backend và remote queue | Chưa bắt đầu | 0% |
| Phase 4 — Logging, monitoring và báo cáo nâng cao | Chưa bắt đầu | 0% |

98% được sử dụng vì các chức năng chính đã được viết và test riêng lẻ, nhưng vẫn cần test batch thực tế trên nhiều group liên tục để xác nhận toàn bộ flow ổn định.

---

# 8. Phase 1 — Local Facebook Posting Bot

## Mục tiêu Phase 1

Nhận một STT của JD, sau đó tự động:

1. Lấy JD từ Supabase.
2. Xác định vị trí tuyển dụng.
3. Lấy đúng ảnh tuyển dụng từ repo.
4. Lấy danh sách group đã gán với JD.
5. Mở từng group.
6. Điền JD.
7. Upload ảnh.
8. Bấm Đăng.
9. Ghi nhận progress.
10. Chuyển sang group tiếp theo.

---

# 9. Step 1 — Chốt logic bot

## Mục tiêu

Xác định bot sẽ chạy theo command và không sử dụng AI.

## Những việc đã hoàn thành

- [x] Bot chỉ chạy khi người dùng nhập command.
- [x] Không sử dụng AI để điều khiển Facebook.
- [x] Không dùng AI để tìm nút.
- [x] Không dùng AI để phân tích nội dung.
- [x] Không có lịch tự chạy.
- [x] Browser flow được viết cố định bằng Playwright.
- [x] Bot chạy local trên Mac.
- [x] GitHub dùng để lưu code.
- [x] Supabase dùng để lưu JD và group.
- [x] Railway được hoãn sang giai đoạn sau.

Step progress: 100%

---

# 10. Step 2 — Tạo GitHub repository

## Mục tiêu

Tạo repository riêng để lưu code và theo dõi thay đổi.

## Những việc đã hoàn thành

- [x] GitHub repository được tạo.
- [x] Repository được clone về Mac.
- [x] Đã xác định lỗi folder tải ZIP không có `.git`.
- [x] Đã clone lại repository bằng `git clone`.
- [x] Local repo đã kết nối với `origin/main`.
- [x] `git pull origin main` hoạt động.
- [x] `git push origin main` hoạt động.
- [x] Repo local có thể cập nhật code từ GitHub.
- [x] Repo local có thể push code ngược lên GitHub.

Repo local:

~/Desktop/facebook-group-posting

Step progress: 100%

---

# 11. Step 3 — Khởi tạo Node.js project

## Mục tiêu

Tạo project Node.js có thể chạy Playwright và Supabase client.

## Những việc đã hoàn thành

- [x] `package.json` được tạo.
- [x] Project dùng ES Module.
- [x] Node.js version yêu cầu từ 20 trở lên.
- [x] Node.js local đang dùng version 22.
- [x] `playwright-core` được cài.
- [x] `@supabase/supabase-js` được cài.
- [x] `dotenv` được cài.
- [x] `package-lock.json` được tạo.
- [x] `node_modules` được cài local.
- [x] `node_modules` không được push lên GitHub.

Các package chính:

playwright-core
@supabase/supabase-js
dotenv

Step progress: 100%

---

# 12. Step 4 — Tạo `.gitignore`

## Mục tiêu

Ngăn dữ liệu local và dữ liệu nhạy cảm bị push lên GitHub.

## Những thứ đã được ignore

- [x] `node_modules/`
- [x] `.env`
- [x] Local group JSON cũ.
- [x] Local post JSON cũ.
- [x] Log files.
- [x] Runtime lock.
- [x] Local progress.
- [x] Playwright test outputs.
- [x] `.DS_Store`
- [x] Editor settings.
- [x] Temporary files.

Step progress: 100%

---

# 13. Step 5 — Tạo cấu hình môi trường

## Mục tiêu

Kết nối local repo với Supabase mà không hard-code key.

## File local

.env

## Các biến chính

SUPABASE_URL=...
SUPABASE_KEY=...
SUPABASE_POSTS_TABLE=facebook_posts

## Những việc đã hoàn thành

- [x] `.env` được tạo local.
- [x] Supabase URL được cấu hình.
- [x] Supabase key được cấu hình.
- [x] Table name được cấu hình.
- [x] `.env` không được push lên GitHub.
- [x] Source code không chứa Supabase key thật.

Step progress: 100%

---

# 14. Step 6 — Tạo Chrome profile riêng

## Mục tiêu

Tách Facebook browser khỏi Chrome cá nhân và các automation flow khác.

## Profile hiện tại

~/.hermes/browser-profiles/facebook

## Những việc đã làm

- [x] Tạo profile Chrome riêng.
- [x] Ban đầu đã thử CDP port `9223`.
- [x] CDP endpoint trả kết quả thành công.
- [x] Phát hiện lỗi Playwright `connectOverCDP`.
- [x] Lỗi CDP là `Browser context management is not supported`.
- [x] Quyết định bỏ cách kết nối CDP.
- [x] Chuyển sang `launchPersistentContext`.
- [x] Playwright trực tiếp mở Chrome profile riêng.
- [x] Cookies Facebook được giữ trong persistent profile.
- [x] Flow khác không sử dụng profile này.
- [x] Không sử dụng Chrome profile cá nhân.

Lưu ý:

CDP port `9223` không còn là phần bắt buộc trong flow hiện tại.

Step progress: 100%

---

# 15. Step 7 — Tạo `src/browser.js`

## Mục tiêu

Quản lý browser Facebook riêng.

## Những việc đã hoàn thành

- [x] Mở Google Chrome bằng Playwright.
- [x] Dùng persistent profile.
- [x] Chạy `headless: false`.
- [x] Chrome hiển thị thật trên màn hình.
- [x] Giữ cookie đăng nhập.
- [x] Mở tab automation.
- [x] Test mở `example.com`.
- [x] Xử lý lỗi profile đang được sử dụng.
- [x] Không sử dụng Chrome của flow khác.
- [x] Có thể đóng Chrome context sau khi hoàn thành job.

File:

src/browser.js

Step progress: 100%

---

# 16. Step 8 — Kiểm tra Facebook session

## Mục tiêu

Xác định tài khoản Facebook đã đăng nhập hay chưa.

## Những việc đã hoàn thành

- [x] Mở Facebook homepage.
- [x] Phát hiện login page.
- [x] Phát hiện password field.
- [x] Phát hiện checkpoint URL.
- [x] Phát hiện verification page.
- [x] Phát hiện session đang hoạt động.
- [x] Không tự nhập password.
- [x] Không tự nhập OTP.
- [x] Không tự xử lý checkpoint.
- [x] Cho phép người dùng login thủ công.

File:

src/facebook-session.js

Step progress: 100%

---

# 17. Step 9 — Cấu trúc dữ liệu Supabase

## Mục tiêu

Lưu JD và danh sách Facebook Group trên Supabase.

## Table `facebook_posts`

Các cột chính:

id
stt
position
jd
created_at

Ý nghĩa:

- `id`: ID kỹ thuật.
- `stt`: số thứ tự để gọi bot.
- `position`: mã vị trí tuyển dụng.
- `jd`: nội dung đăng Facebook.
- `created_at`: thời gian tạo.

Ví dụ:

stt: 1
position: content-creator
jd: Nội dung tuyển dụng Content Creator

## Table `facebook_groups`

Các cột chính:

id
group_key
name
url
enabled
created_at

Ý nghĩa:

- `group_key`: mã nội bộ như `group-01`.
- `name`: tên Facebook Group.
- `url`: link group.
- `enabled`: group có được bot sử dụng không.

## Table `facebook_post_groups`

Các cột chính:

post_id
group_id
created_at

Table này dùng để gắn:

Một JD
→ nhiều Facebook Group

## Những việc đã hoàn thành

- [x] JD được lưu trong Supabase.
- [x] Position được lưu trong Supabase.
- [x] Danh sách group được chuyển từ JSON lên Supabase.
- [x] Bảng nối JD với group được tạo.
- [x] JD Content Creator được gắn với 17 group.
- [x] Group trùng URL được loại bỏ.
- [x] `group-02` và `group-10` từng trùng URL.
- [x] Danh sách cuối có 17 group duy nhất.
- [x] Group có thể bật/tắt bằng `enabled`.

Step progress: 100%

---

# 18. Step 10 — Đọc JD từ Supabase

## Mục tiêu

Nhận một STT và lấy đúng JD.

## File

src/supabase.js

## Những việc đã hoàn thành

- [x] Kết nối Supabase bằng environment variables.
- [x] Không hard-code Supabase key.
- [x] Nhận `stt`.
- [x] Query table `facebook_posts`.
- [x] Lấy `id`.
- [x] Lấy `stt`.
- [x] Lấy `position`.
- [x] Lấy `jd`.
- [x] Validate STT là số nguyên dương.
- [x] Báo lỗi khi STT không tồn tại.
- [x] Báo lỗi khi JD trống.
- [x] Báo lỗi khi position trống.
- [x] Test đọc JD thành công.

Command test:

node src/supabase.js 1

Step progress: 100%

---

# 19. Step 11 — Lưu ảnh theo vị trí trong repo

## Mục tiêu

Mỗi vị trí tuyển dụng tương ứng với một ảnh.

Ảnh không lưu trên Supabase.

## Cấu trúc

assets/
└── positions/
    ├── content-creator.jpg
    ├── motion-designer.jpg
    └── ...

## File mapping

data/positions.json

Ví dụ:

{
  "id": "content-creator",
  "name": "Content Creator",
  "image": "assets/positions/content-creator.jpg",
  "enabled": true
}

## Những việc đã hoàn thành

- [x] Thư mục ảnh được tạo.
- [x] Ảnh Content Creator được thêm.
- [x] `positions.json` được tạo.
- [x] Position ID khớp với Supabase.
- [x] Mỗi position có đúng một ảnh.
- [x] Đường dẫn ảnh được lưu trong JSON.
- [x] Ảnh được push lên GitHub.

Step progress: 100%

---

# 20. Step 12 — Tạo `src/positions.js`

## Mục tiêu

Nhận position và tìm đúng ảnh trong repo.

## Những việc đã hoàn thành

- [x] Đọc `positions.json`.
- [x] Validate cấu trúc JSON.
- [x] Validate position ID.
- [x] Chặn position trùng ID.
- [x] Chặn position bị disabled.
- [x] Tìm đúng ảnh.
- [x] Chuyển đường dẫn tương đối thành đường dẫn tuyệt đối.
- [x] Kiểm tra file ảnh tồn tại.
- [x] Báo lỗi khi ảnh bị thiếu.
- [x] Test mapping position thành công.

Command test:

node src/positions.js content-creator

Step progress: 100%

---

# 21. Step 13 — Tạo `src/post-data.js`

## Mục tiêu

Gộp JD và ảnh thành một object duy nhất.

## Flow

STT
→ đọc Supabase
→ lấy position
→ đọc positions.json
→ lấy đúng ảnh
→ trả dữ liệu hoàn chỉnh

## Output

id
stt
jd
position.id
position.name
image.relativePath
image.absolutePath

## Những việc đã hoàn thành

- [x] Đọc JD theo STT.
- [x] Lấy position.
- [x] Map position sang ảnh.
- [x] Kiểm tra ảnh tồn tại.
- [x] Trả object hoàn chỉnh.
- [x] Test thành công với STT 1.

Command test:

node src/post-data.js 1

Step progress: 100%

---

# 22. Step 14 — Đọc danh sách group theo JD

## Mục tiêu

Nhận một STT và lấy toàn bộ group đã gắn với JD đó.

## File

src/post-groups.js

## Những việc đã hoàn thành

- [x] Tìm post theo STT.
- [x] Lấy post ID.
- [x] Query bảng `facebook_post_groups`.
- [x] Join với `facebook_groups`.
- [x] Lấy `group_key`.
- [x] Lấy tên group.
- [x] Lấy URL group.
- [x] Lọc group disabled.
- [x] Sắp xếp group theo `group_key`.
- [x] Trả đúng 17 group.
- [x] Báo lỗi nếu JD không có group.

Command test:

node src/post-groups.js 1

Step progress: 100%

---

# 23. Step 15 — Mở Facebook Group

## Mục tiêu

Mở đúng Facebook Group từ URL.

## File

src/open-group.js

## Những việc đã hoàn thành

- [x] Đọc group.
- [x] Mở Chrome profile riêng.
- [x] Mở URL group.
- [x] Chờ trang load.
- [x] Giữ browser mở để kiểm tra.
- [x] Test mở group thành công.

Step progress: 100%

---

# 24. Step 16 — Mở composer

## Mục tiêu

Click vào vùng tạo bài viết trong Facebook Group.

## File

src/open-composer.js

## Selector ban đầu

Bot ban đầu tìm các text:

Viết gì đó
Tạo bài viết
Bạn đang nghĩ gì
Write something
Create post
What's on your mind

## Lỗi gặp phải

Giao diện thực tế hiển thị:

Bạn viết gì đi...

Do selector chưa có text này nên bot mở đúng group nhưng không mở được composer.

## Cách đã sửa

- [x] Bổ sung selector `Bạn viết gì đi`.
- [x] Ưu tiên tìm element có `role="button"`.
- [x] Không chỉ click text node.
- [x] Hỗ trợ tiếng Việt.
- [x] Hỗ trợ tiếng Anh.
- [x] Chờ composer dialog mở.
- [x] Tìm editor trong dialog.
- [x] Test composer mở thành công.

Ngoài ra:

- [x] File có thể nhận group từ JSON cũ.
- [x] File có thể nhận group object từ Supabase.
- [x] Flow Supabase không còn phụ thuộc vào `data/groups.json`.

Step progress: 100%

---

# 25. Step 17 — Điền nội dung JD

## Mục tiêu

Điền nguyên văn nội dung JD vào Facebook composer.

## Những việc đã hoàn thành

- [x] Click editor.
- [x] Điền JD bằng Playwright.
- [x] Giữ tiếng Việt.
- [x] Giữ xuống dòng.
- [x] Đọc lại nội dung sau khi điền.
- [x] Normalize line ending.
- [x] So sánh content thực tế với content Supabase.
- [x] Báo lỗi nếu content khác.
- [x] Test content được điền thành công.

Step progress: 100%

---

# 26. Step 18 — Upload ảnh

## Mục tiêu

Upload đúng ảnh theo position vào composer.

## Những việc đã hoàn thành

- [x] Lấy đường dẫn ảnh tuyệt đối.
- [x] Tìm `input[type="file"]`.
- [x] Ưu tiên input nhận image.
- [x] Upload bằng `setInputFiles`.
- [x] Chờ Facebook xử lý ảnh.
- [x] Tìm preview dạng blob.
- [x] Tìm preview từ Facebook CDN.
- [x] Tìm background-image preview.
- [x] Timeout tối đa 120 giây.
- [x] Không tiếp tục nếu không xác nhận được preview.
- [x] Test ảnh Content Creator hiển thị thành công.

Step progress: 100%

---

# 27. Step 19 — Chọn group theo số thứ tự

## Mục tiêu

Cho phép test riêng từng group.

## Command

node src/prepare-post.js 1 1

Ý nghĩa:

STT 1
Group thứ 1

Ví dụ group thứ hai:

node src/prepare-post.js 1 2

## Những việc đã hoàn thành

- [x] Nhận STT.
- [x] Nhận group number.
- [x] Validate group number.
- [x] Chuyển group number sang array index.
- [x] Báo lỗi nếu group number vượt danh sách.
- [x] Hiển thị group hiện tại.
- [x] Hiển thị tổng số group.
- [x] Test group 1.
- [x] Test group 2.

Step progress: 100%

---

# 28. Step 20 — Job lock

## Mục tiêu

Ngăn hai job cùng điều khiển Chrome Facebook.

## File

src/job-lock.js

## Runtime lock

runtime/facebook-post.lock

## Những việc đã hoàn thành

- [x] Tạo lock khi job bắt đầu.
- [x] Lưu process ID.
- [x] Lưu STT.
- [x] Lưu group number.
- [x] Lưu thời gian bắt đầu.
- [x] Chặn job thứ hai.
- [x] Báo PID của job đang chạy.
- [x] Xóa lock khi job hoàn thành.
- [x] Xóa lock khi job lỗi được xử lý.
- [x] Xử lý stale lock.
- [x] Có command kill process thủ công.
- [x] Có command xóa lock thủ công.

Command đóng bot:

kill <PID>

Nếu process không dừng:

kill -9 <PID>

Xóa lock:

rm -f runtime/facebook-post.lock

Đóng Chrome bot:

pkill -f "$HOME/.hermes/browser-profiles/facebook"

Step progress: 100%

---

# 29. Step 21 — Sửa lỗi CLI không chạy

## Lỗi gặp phải

Command:

node src/prepare-post.js 1 1

thoát ngay và không mở browser.

## Nguyên nhân

Đoạn kiểm tra direct execution không gọi function `run()` đúng cách.

## Cách đã sửa

Chuyển sang so sánh:

import.meta.url

với:

pathToFileURL(path.resolve(process.argv[1])).href

## Kết quả

- [x] File nhận đúng command.
- [x] `run()` được gọi.
- [x] Job lock được tạo.
- [x] Browser mở.
- [x] JD được điền.
- [x] Ảnh được upload.

Step progress: 100%

---

# 30. Step 22 — Progress tracking

## Mục tiêu

Lưu danh sách group đã hoàn thành để tránh đăng trùng.

## File code

src/post-progress.js

## File dữ liệu local

runtime/post-progress.json

## Dữ liệu lưu

STT
Danh sách group đã hoàn thành
Group number cuối
Thời gian cập nhật

## Những việc đã hoàn thành

- [x] Tạo progress file tự động.
- [x] Đọc progress theo STT.
- [x] Mark group đã hoàn thành.
- [x] Không thêm group trùng.
- [x] Lưu `lastGroupNumber`.
- [x] Lưu `updatedAt`.
- [x] Reset progress.
- [x] File progress không push lên GitHub.
- [x] Dùng temporary file trước khi rename.
- [x] Test mark group 1.
- [x] Test mark group 2.
- [x] Test reset progress.

Command xem trạng thái:

node src/post-progress.js status 1

Command reset:

node src/post-progress.js reset 1

Step progress: 100%

---

# 31. Step 23 — Chế độ `next`

## Mục tiêu

Không cần tự nhớ group number.

## Command

node src/prepare-post.js 1 next

## Flow

Đọc progress
→ lấy danh sách group
→ tìm group đầu tiên chưa hoàn thành
→ chuẩn bị hoặc đăng bài
→ mark progress

## Những việc đã hoàn thành

- [x] Đọc progress.
- [x] Chuyển danh sách đã hoàn thành thành Set.
- [x] Tìm group chưa hoàn thành đầu tiên.
- [x] Chọn đúng group tiếp theo.
- [x] Báo lỗi khi tất cả group đã hoàn thành.
- [x] Cho phép reset để chạy lại.
- [x] Hiển thị `x/17`.

Step progress: 100%

---

# 32. Step 24 — Tự động bấm nút Đăng

## Mục tiêu

Bot tự bấm Post sau khi content và ảnh đã sẵn sàng.

## Những việc đã hoàn thành

- [x] Tìm button có tên `Đăng`.
- [x] Tìm button có tên `Post`.
- [x] Tìm button bằng role.
- [x] Tìm button bằng aria-label.
- [x] Tìm button trong composer dialog.
- [x] Tìm button trên toàn page nếu cần.
- [x] Chờ button sẵn sàng.
- [x] Không click button bị ẩn.
- [x] Kiểm tra `aria-disabled`.
- [x] Kiểm tra native `disabled`.
- [x] Kiểm tra button có kích thước thật.
- [x] Click button Post.
- [x] Chờ composer đóng.
- [x] Phát hiện bài đang chờ duyệt.
- [x] Phát hiện Facebook error message.
- [x] Không update progress nếu không xác nhận được kết quả.

## Lỗi đã gặp

Facebook hiển thị nút Đăng màu xanh nhưng code báo disabled.

## Nguyên nhân

Có thể Facebook có nhiều element cùng chữ `Đăng`.

Code cũ lấy element đầu tiên và chọn nhầm button ẩn hoặc button chưa active.

## Cách đã sửa

Bot duyệt toàn bộ candidate và chỉ chọn button:

đang hiển thị
có kích thước thật
aria-disabled không phải true
native disabled không phải true

Step progress: 95%

Phần cần xác nhận thêm:

- [ ] Test lại auto-click Post sau selector mới.
- [ ] Xác nhận composer đóng sau khi đăng.
- [ ] Xác nhận progress được ghi đúng.

---

# 33. Step 25 — Batch chạy toàn bộ group

## Mục tiêu

Chạy toàn bộ group bằng một command.

## File

src/prepare-all.js

## Command

node src/prepare-all.js 1

## Flow

Đọc STT
→ lấy 17 group
→ đọc progress
→ bỏ qua group đã hoàn thành
→ xử lý group còn lại
→ group 1
→ group 2
→ group 3
→ ...
→ group 17

## Những việc đã hoàn thành

- [x] Nhận STT.
- [x] Lấy toàn bộ group.
- [x] Đọc progress hiện tại.
- [x] Bỏ qua group đã hoàn thành.
- [x] Chạy tuần tự từng group.
- [x] Không chạy nhiều browser song song.
- [x] Dừng batch nếu một group lỗi.
- [x] Hiển thị group bị lỗi.
- [x] Cho phép chạy lại command.
- [x] Tiếp tục từ group chưa hoàn thành.
- [x] Dùng job lock cho toàn batch.
- [x] Hiển thị batch progress.
- [x] Báo khi toàn bộ group hoàn thành.

Command tiếp tục batch:

node src/prepare-all.js 1

Command chạy lại từ đầu:

node src/post-progress.js reset 1
rm -f runtime/facebook-post.lock
pkill -f "$HOME/.hermes/browser-profiles/facebook"
node src/prepare-all.js 1

Step progress: 95%

Phần còn cần test:

- [ ] Auto-post thành công ở group đầu tiên.
- [ ] Bot tự đóng Chrome.
- [ ] Bot tự mở group tiếp theo.
- [ ] Test liên tục ít nhất 2–3 group.
- [ ] Test batch đủ 17 group.

---

# 34. Các file hiện có

facebook-group-posting/
│
├── package.json
├── package-lock.json
├── .gitignore
├── .env.example
├── README.md
│
├── src/
│   ├── browser.js
│   ├── facebook-session.js
│   ├── groups.js
│   ├── job-lock.js
│   ├── open-composer.js
│   ├── open-group.js
│   ├── positions.js
│   ├── post-data.js
│   ├── post-groups.js
│   ├── post-progress.js
│   ├── prepare-post.js
│   ├── prepare-all.js
│   └── supabase.js
│
├── data/
│   └── positions.json
│
├── assets/
│   └── positions/
│       └── content-creator.jpg
│
├── runtime/
│   ├── facebook-post.lock
│   └── post-progress.json
│
├── supabase/
│   ├── groups-schema.sql
│   └── groups-seed.sql
│
└── docs/
    └── PROGRESS.md

Lưu ý:

Các file trong `runtime/` chỉ xuất hiện khi bot chạy và không được push lên GitHub.

---

# 35. Command sử dụng hằng ngày

## Vào repo

cd ~/Desktop/facebook-group-posting

## Kiểm tra syntax

node --check src/prepare-post.js
node --check src/prepare-all.js
node --check src/job-lock.js
node --check src/post-progress.js

## Test một group cụ thể

node src/prepare-post.js 1 1

## Chạy group tiếp theo

node src/prepare-post.js 1 next

## Chạy toàn bộ group

node src/prepare-all.js 1

## Xem progress

node src/post-progress.js status 1

## Reset progress

node src/post-progress.js reset 1

## Xóa lock

rm -f runtime/facebook-post.lock

## Đóng Chrome bot

pkill -f "$HOME/.hermes/browser-profiles/facebook"

## Đóng process bot theo PID

kill <PID>

Nếu không dừng:

kill -9 <PID>

## Chạy lại toàn bộ từ đầu

cd ~/Desktop/facebook-group-posting
node src/post-progress.js reset 1
rm -f runtime/facebook-post.lock
pkill -f "$HOME/.hermes/browser-profiles/facebook"
node src/prepare-all.js 1

---

# 36. Trạng thái chức năng

| Chức năng | Trạng thái |
|---|---:|
| Repo GitHub | 100% |
| Node.js project | 100% |
| Playwright setup | 100% |
| Supabase connection | 100% |
| Đọc JD theo STT | 100% |
| Lấy position | 100% |
| Map position sang ảnh | 100% |
| Đọc danh sách group | 100% |
| Một JD gắn nhiều group | 100% |
| Mở Chrome profile riêng | 100% |
| Mở Facebook Group | 100% |
| Mở composer | 100% |
| Điền JD | 100% |
| Upload ảnh | 100% |
| Chọn group theo số | 100% |
| Chế độ `next` | 100% |
| Job lock | 100% |
| Progress tracking | 100% |
| Tìm nút Đăng | 100% |
| Click nút Đăng | 95% |
| Xác nhận đăng thành công | 95% |
| Chạy batch nhiều group | 95% |
| Test đủ 17 group | 0% |

---

# 37. Việc còn lại

## Việc 1 — Test auto-post sau selector mới

Chạy:

node src/post-progress.js reset 1
rm -f runtime/facebook-post.lock
pkill -f "$HOME/.hermes/browser-profiles/facebook"
node src/prepare-post.js 1 1

Điều kiện đạt:

- Nút Đăng được tìm thấy.
- Bot tự click.
- Composer đóng.
- Terminal báo `submitted` hoặc `pending_approval`.
- Progress thành `1/17`.
- Chrome đóng.
- Process kết thúc.

## Việc 2 — Test batch 2–3 group

Chạy:

node src/prepare-all.js 1

Điều kiện đạt:

- Group 1 được đăng.
- Bot đóng browser.
- Bot tự mở group 2.
- Group 2 được đăng.
- Bot tự mở group 3.
- Progress tăng đúng.

## Việc 3 — Test đủ danh sách

Sau khi test 2–3 group ổn định, chạy toàn bộ 17 group.

## Việc 4 — Cập nhật log lỗi thực tế

Ghi lại các group có:

- Không cho đăng.
- Bắt chọn topic.
- Bắt xác nhận nội quy.
- Bài phải chờ duyệt.
- Composer khác giao diện.
- Nút Đăng có cấu trúc khác.
- Không còn là thành viên.

---

# 38. Điều kiện Phase 1 đạt 100%

Phase 1 được xem là hoàn thành khi:

- [x] Bot đọc đúng JD.
- [x] Bot lấy đúng ảnh.
- [x] Bot lấy đúng danh sách group.
- [x] Bot mở đúng group.
- [x] Bot mở đúng composer.
- [x] Bot điền đúng content.
- [x] Bot upload đúng ảnh.
- [ ] Bot tự bấm Đăng ổn định.
- [ ] Bot xác nhận kết quả đăng.
- [ ] Bot lưu progress sau khi đăng.
- [ ] Bot tự chuyển sang group tiếp theo.
- [ ] Batch chạy ổn định ít nhất 2–3 group.
- [ ] Test đầy đủ 17 group.

Current Phase 1 progress: 98%

---

# 39. Changelog

## 27/07/2026

- Chốt bot chạy bằng command.
- Loại bỏ AI khỏi browser automation.
- Tạo GitHub repository.
- Clone repo về Mac.
- Khởi tạo Node.js project.
- Cài Playwright Core.
- Tạo `.gitignore`.
- Tạo cấu hình environment.
- Tạo Chrome profile riêng.
- Thử kết nối Chrome bằng CDP port 9223.
- Phát hiện lỗi `connectOverCDP`.
- Chuyển sang persistent Chrome context.
- Test mở browser thành công.
- Tạo Supabase table cho JD.
- Tạo Supabase table cho Facebook Group.
- Tạo bảng nối JD với group.
- Import danh sách group.
- Loại bỏ group trùng URL.
- Gắn JD Content Creator với 17 group.
- Lưu ảnh Content Creator trong GitHub.
- Tạo position image mapping.
- Tạo Supabase data loader.
- Tạo position resolver.
- Gộp JD và ảnh.
- Đọc danh sách group theo STT.
- Mở Facebook Group.
- Kiểm tra Facebook session.
- Mở composer.
- Sửa selector theo text `Bạn viết gì đi...`.
- Điền JD thành công.
- Upload ảnh thành công.
- Tạo group number selection.
- Tạo job lock.
- Sửa lỗi CLI không gọi `run()`.
- Tạo progress tracking.
- Tạo chế độ `next`.
- Tạo batch chạy toàn bộ group.
- Thêm logic tự tìm nút Đăng.
- Phát hiện lỗi chọn nhầm button disabled.
- Update logic tìm button đang hiển thị và enabled.
- Chuẩn bị command chạy toàn bộ danh sách.

---

# 40. Current work

Current step:

Test auto-post và batch tuần tự

Current objective:

Xác nhận bot tự click Đăng thành công,
đóng browser,
ghi progress,
và tự chuyển sang group tiếp theo.

Current blocker:

Cần test lại selector nút Đăng vừa được update.

Next action:

cd ~/Desktop/facebook-group-posting
node src/post-progress.js reset 1
rm -f runtime/facebook-post.lock
pkill -f "$HOME/.hermes/browser-profiles/facebook"
node src/prepare-post.js 1 1
Library
/
facebook-post-bot-progress.txt


# Facebook Post Bot — Theo dõi tiến độ

Cập nhật lần cuối: 27/07/2026

---

# 1. Mục tiêu dự án

Xây dựng một bot đăng bài tuyển dụng lên nhiều Facebook Group.

Bot chỉ chạy khi người dùng chủ động nhập lệnh trong Terminal.

Bot sử dụng browser automation được viết bằng code cố định, không sử dụng AI để:

- Nhìn giao diện Facebook.
- Tự suy luận vị trí nút.
- Tự quyết định thao tác.
- Tự tạo nội dung.
- Tự thay đổi JD.

Nội dung JD được lấy từ Supabase.

Ảnh tuyển dụng được lưu trực tiếp trong GitHub repository và được gắn với từng vị trí tuyển dụng.

---

# 2. Flow hiện tại

Flow hoàn chỉnh hiện tại:

Người dùng nhập JD vào Supabase
        ↓
JD có STT và position
        ↓
JD được gắn với danh sách Facebook Group
        ↓
Người dùng chạy một command trong Terminal
        ↓
Bot lấy JD từ Supabase
        ↓
Bot lấy ảnh tương ứng với position từ repo
        ↓
Bot lấy danh sách group đã gắn với JD
        ↓
Bot mở Chrome profile Facebook riêng
        ↓
Bot mở group đầu tiên
        ↓
Bot mở giao diện tạo bài viết
        ↓
Bot điền nội dung JD
        ↓
Bot upload ảnh
        ↓
Bot tìm nút Đăng
        ↓
Bot tự bấm Đăng
        ↓
Bot xác nhận composer đã đóng hoặc bài đang chờ duyệt
        ↓
Bot lưu group đã hoàn thành
        ↓
Bot đóng Chrome
        ↓
Bot tự chuyển sang group tiếp theo
        ↓
Lặp lại đến hết danh sách group

---

# 3. Nguyên tắc vận hành

- Bot chỉ chạy khi người dùng nhập command.
- Không có scheduler tự chạy ngầm.
- Không có AI tham gia vào browser flow.
- Không lưu mật khẩu Facebook trong code.
- Không tự xử lý OTP.
- Không tự xử lý CAPTCHA.
- Không tự xử lý Facebook checkpoint.
- Chrome Facebook dùng profile riêng.
- Flow Facebook không dùng chung browser profile với flow khác.
- Một thời điểm chỉ có một Facebook posting job được chạy.
- Nếu batch bị dừng, lần chạy tiếp theo sẽ tiếp tục từ group chưa hoàn thành.
- Nếu group đã hoàn thành, bot sẽ bỏ qua để tránh đăng trùng.

---

# 4. Kiến trúc hiện tại

GitHub Repository
├── Source code
├── Playwright automation
├── Position image mapping
├── Recruitment images
└── Progress documentation

Supabase
├── Facebook post / JD data
├── Facebook Group list
└── JD → Group relationships

Mac local
├── Node.js
├── Playwright
├── Dedicated Chrome profile
├── Runtime lock
└── Local progress tracking

---

# 5. Nơi chạy hệ thống

Bot hiện chạy local trên Mac.

Đường dẫn repo local:

~/Desktop/facebook-group-posting

Lệnh vào repo:

cd ~/Desktop/facebook-group-posting

Railway chưa được sử dụng trong flow hiện tại.

Railway có thể được thêm sau để làm:

- Dashboard.
- Quản lý JD.
- Quản lý group.
- Theo dõi lịch sử đăng.
- Quản lý queue.
- Điều khiển local worker.

---

# 6. Công nghệ đang sử dụng

- Node.js 22
- JavaScript ES Module
- Playwright Core
- Google Chrome
- Supabase PostgreSQL
- Supabase JavaScript Client
- dotenv
- Git
- GitHub
- macOS Terminal

---

# 7. Trạng thái tổng thể

Current overall progress: 98%

| Giai đoạn | Trạng thái | Tiến độ |
|---|---|---:|
| Phase 1 — Local Facebook posting bot | Gần hoàn thành | 98% |
| Phase 2 — Dashboard và quản lý dữ liệu | Chưa bắt đầu | 0% |
| Phase 3 — Railway backend và remote queue | Chưa bắt đầu | 0% |
| Phase 4 — Logging, monitoring và báo cáo nâng cao | Chưa bắt đầu | 0% |

98% được sử dụng vì các chức năng chính đã được viết và test riêng lẻ, nhưng vẫn cần test batch thực tế trên nhiều group liên tục để xác nhận toàn bộ flow ổn định.

---

# 8. Phase 1 — Local Facebook Posting Bot

## Mục tiêu Phase 1

Nhận một STT của JD, sau đó tự động:

1. Lấy JD từ Supabase.
2. Xác định vị trí tuyển dụng.
3. Lấy đúng ảnh tuyển dụng từ repo.
4. Lấy danh sách group đã gán với JD.
5. Mở từng group.
6. Điền JD.
7. Upload ảnh.
8. Bấm Đăng.
9. Ghi nhận progress.
10. Chuyển sang group tiếp theo.

---

# 9. Step 1 — Chốt logic bot

## Mục tiêu

Xác định bot sẽ chạy theo command và không sử dụng AI.

## Những việc đã hoàn thành

- [x] Bot chỉ chạy khi người dùng nhập command.
- [x] Không sử dụng AI để điều khiển Facebook.
- [x] Không dùng AI để tìm nút.
- [x] Không dùng AI để phân tích nội dung.
- [x] Không có lịch tự chạy.
- [x] Browser flow được viết cố định bằng Playwright.
- [x] Bot chạy local trên Mac.
- [x] GitHub dùng để lưu code.
- [x] Supabase dùng để lưu JD và group.
- [x] Railway được hoãn sang giai đoạn sau.

Step progress: 100%

---

# 10. Step 2 — Tạo GitHub repository

## Mục tiêu

Tạo repository riêng để lưu code và theo dõi thay đổi.

## Những việc đã hoàn thành

- [x] GitHub repository được tạo.
- [x] Repository được clone về Mac.
- [x] Đã xác định lỗi folder tải ZIP không có `.git`.
- [x] Đã clone lại repository bằng `git clone`.
- [x] Local repo đã kết nối với `origin/main`.
- [x] `git pull origin main` hoạt động.
- [x] `git push origin main` hoạt động.
- [x] Repo local có thể cập nhật code từ GitHub.
- [x] Repo local có thể push code ngược lên GitHub.

Repo local:

~/Desktop/facebook-group-posting

Step progress: 100%

---

# 11. Step 3 — Khởi tạo Node.js project

## Mục tiêu

Tạo project Node.js có thể chạy Playwright và Supabase client.

## Những việc đã hoàn thành

- [x] `package.json` được tạo.
- [x] Project dùng ES Module.
- [x] Node.js version yêu cầu từ 20 trở lên.
- [x] Node.js local đang dùng version 22.
- [x] `playwright-core` được cài.
- [x] `@supabase/supabase-js` được cài.
- [x] `dotenv` được cài.
- [x] `package-lock.json` được tạo.
- [x] `node_modules` được cài local.
- [x] `node_modules` không được push lên GitHub.

Các package chính:

playwright-core
@supabase/supabase-js
dotenv

Step progress: 100%

---

# 12. Step 4 — Tạo `.gitignore`

## Mục tiêu

Ngăn dữ liệu local và dữ liệu nhạy cảm bị push lên GitHub.

## Những thứ đã được ignore

- [x] `node_modules/`
- [x] `.env`
- [x] Local group JSON cũ.
- [x] Local post JSON cũ.
- [x] Log files.
- [x] Runtime lock.
- [x] Local progress.
- [x] Playwright test outputs.
- [x] `.DS_Store`
- [x] Editor settings.
- [x] Temporary files.

Step progress: 100%

---

# 13. Step 5 — Tạo cấu hình môi trường

## Mục tiêu

Kết nối local repo với Supabase mà không hard-code key.

## File local

.env

## Các biến chính

SUPABASE_URL=...
SUPABASE_KEY=...
SUPABASE_POSTS_TABLE=facebook_posts

## Những việc đã hoàn thành

- [x] `.env` được tạo local.
- [x] Supabase URL được cấu hình.
- [x] Supabase key được cấu hình.
- [x] Table name được cấu hình.
- [x] `.env` không được push lên GitHub.
- [x] Source code không chứa Supabase key thật.

Step progress: 100%

---

# 14. Step 6 — Tạo Chrome profile riêng

## Mục tiêu

Tách Facebook browser khỏi Chrome cá nhân và các automation flow khác.

## Profile hiện tại

~/.hermes/browser-profiles/facebook

## Những việc đã làm

- [x] Tạo profile Chrome riêng.
- [x] Ban đầu đã thử CDP port `9223`.
- [x] CDP endpoint trả kết quả thành công.
- [x] Phát hiện lỗi Playwright `connectOverCDP`.
- [x] Lỗi CDP là `Browser context management is not supported`.
- [x] Quyết định bỏ cách kết nối CDP.
- [x] Chuyển sang `launchPersistentContext`.
- [x] Playwright trực tiếp mở Chrome profile riêng.
- [x] Cookies Facebook được giữ trong persistent profile.
- [x] Flow khác không sử dụng profile này.
- [x] Không sử dụng Chrome profile cá nhân.

Lưu ý:

CDP port `9223` không còn là phần bắt buộc trong flow hiện tại.

Step progress: 100%

---

# 15. Step 7 — Tạo `src/browser.js`

## Mục tiêu

Quản lý browser Facebook riêng.

## Những việc đã hoàn thành

- [x] Mở Google Chrome bằng Playwright.
- [x] Dùng persistent profile.
- [x] Chạy `headless: false`.
- [x] Chrome hiển thị thật trên màn hình.
- [x] Giữ cookie đăng nhập.
- [x] Mở tab automation.
- [x] Test mở `example.com`.
- [x] Xử lý lỗi profile đang được sử dụng.
- [x] Không sử dụng Chrome của flow khác.
- [x] Có thể đóng Chrome context sau khi hoàn thành job.

File:

src/browser.js

Step progress: 100%

---

# 16. Step 8 — Kiểm tra Facebook session

## Mục tiêu

Xác định tài khoản Facebook đã đăng nhập hay chưa.

## Những việc đã hoàn thành

- [x] Mở Facebook homepage.
- [x] Phát hiện login page.
- [x] Phát hiện password field.
- [x] Phát hiện checkpoint URL.
- [x] Phát hiện verification page.
- [x] Phát hiện session đang hoạt động.
- [x] Không tự nhập password.
- [x] Không tự nhập OTP.
- [x] Không tự xử lý checkpoint.
- [x] Cho phép người dùng login thủ công.

File:

src/facebook-session.js

Step progress: 100%

---

# 17. Step 9 — Cấu trúc dữ liệu Supabase

## Mục tiêu

Lưu JD và danh sách Facebook Group trên Supabase.

## Table `facebook_posts`

Các cột chính:

id
stt
position
jd
created_at

Ý nghĩa:

- `id`: ID kỹ thuật.
- `stt`: số thứ tự để gọi bot.
- `position`: mã vị trí tuyển dụng.
- `jd`: nội dung đăng Facebook.
- `created_at`: thời gian tạo.

Ví dụ:

stt: 1
position: content-creator
jd: Nội dung tuyển dụng Content Creator

## Table `facebook_groups`

Các cột chính:

id
group_key
name
url
enabled
created_at

Ý nghĩa:

- `group_key`: mã nội bộ như `group-01`.
- `name`: tên Facebook Group.
- `url`: link group.
- `enabled`: group có được bot sử dụng không.

## Table `facebook_post_groups`

Các cột chính:

post_id
group_id
created_at

Table này dùng để gắn:

Một JD
→ nhiều Facebook Group

## Những việc đã hoàn thành

- [x] JD được lưu trong Supabase.
- [x] Position được lưu trong Supabase.
- [x] Danh sách group được chuyển từ JSON lên Supabase.
- [x] Bảng nối JD với group được tạo.
- [x] JD Content Creator được gắn với 17 group.
- [x] Group trùng URL được loại bỏ.
- [x] `group-02` và `group-10` từng trùng URL.
- [x] Danh sách cuối có 17 group duy nhất.
- [x] Group có thể bật/tắt bằng `enabled`.

Step progress: 100%

---

# 18. Step 10 — Đọc JD từ Supabase

## Mục tiêu

Nhận một STT và lấy đúng JD.

## File

src/supabase.js

## Những việc đã hoàn thành

- [x] Kết nối Supabase bằng environment variables.
- [x] Không hard-code Supabase key.
- [x] Nhận `stt`.
- [x] Query table `facebook_posts`.
- [x] Lấy `id`.
- [x] Lấy `stt`.
- [x] Lấy `position`.
- [x] Lấy `jd`.
- [x] Validate STT là số nguyên dương.
- [x] Báo lỗi khi STT không tồn tại.
- [x] Báo lỗi khi JD trống.
- [x] Báo lỗi khi position trống.
- [x] Test đọc JD thành công.

Command test:

node src/supabase.js 1

Step progress: 100%

---

# 19. Step 11 — Lưu ảnh theo vị trí trong repo

## Mục tiêu

Mỗi vị trí tuyển dụng tương ứng với một ảnh.

Ảnh không lưu trên Supabase.

## Cấu trúc

assets/
└── positions/
    ├── content-creator.jpg
    ├── motion-designer.jpg
    └── ...

## File mapping

data/positions.json

Ví dụ:

{
  "id": "content-creator",
  "name": "Content Creator",
  "image": "assets/positions/content-creator.jpg",
  "enabled": true
}

## Những việc đã hoàn thành

- [x] Thư mục ảnh được tạo.
- [x] Ảnh Content Creator được thêm.
- [x] `positions.json` được tạo.
- [x] Position ID khớp với Supabase.
- [x] Mỗi position có đúng một ảnh.
- [x] Đường dẫn ảnh được lưu trong JSON.
- [x] Ảnh được push lên GitHub.

Step progress: 100%

---

# 20. Step 12 — Tạo `src/positions.js`

## Mục tiêu

Nhận position và tìm đúng ảnh trong repo.

## Những việc đã hoàn thành

- [x] Đọc `positions.json`.
- [x] Validate cấu trúc JSON.
- [x] Validate position ID.
- [x] Chặn position trùng ID.
- [x] Chặn position bị disabled.
- [x] Tìm đúng ảnh.
- [x] Chuyển đường dẫn tương đối thành đường dẫn tuyệt đối.
- [x] Kiểm tra file ảnh tồn tại.
- [x] Báo lỗi khi ảnh bị thiếu.
- [x] Test mapping position thành công.

Command test:

node src/positions.js content-creator

Step progress: 100%

---

# 21. Step 13 — Tạo `src/post-data.js`

## Mục tiêu

Gộp JD và ảnh thành một object duy nhất.

## Flow

STT
→ đọc Supabase
→ lấy position
→ đọc positions.json
→ lấy đúng ảnh
→ trả dữ liệu hoàn chỉnh

## Output

id
stt
jd
position.id
position.name
image.relativePath
image.absolutePath

## Những việc đã hoàn thành

- [x] Đọc JD theo STT.
- [x] Lấy position.
- [x] Map position sang ảnh.
- [x] Kiểm tra ảnh tồn tại.
- [x] Trả object hoàn chỉnh.
- [x] Test thành công với STT 1.

Command test:

node src/post-data.js 1

Step progress: 100%

---

# 22. Step 14 — Đọc danh sách group theo JD

## Mục tiêu

Nhận một STT và lấy toàn bộ group đã gắn với JD đó.

## File

src/post-groups.js

## Những việc đã hoàn thành

- [x] Tìm post theo STT.
- [x] Lấy post ID.
- [x] Query bảng `facebook_post_groups`.
- [x] Join với `facebook_groups`.
- [x] Lấy `group_key`.
- [x] Lấy tên group.
- [x] Lấy URL group.
- [x] Lọc group disabled.
- [x] Sắp xếp group theo `group_key`.
- [x] Trả đúng 17 group.
- [x] Báo lỗi nếu JD không có group.

Command test:

node src/post-groups.js 1

Step progress: 100%

---

# 23. Step 15 — Mở Facebook Group

## Mục tiêu

Mở đúng Facebook Group từ URL.

## File

src/open-group.js

## Những việc đã hoàn thành

- [x] Đọc group.
- [x] Mở Chrome profile riêng.
- [x] Mở URL group.
- [x] Chờ trang load.
- [x] Giữ browser mở để kiểm tra.
- [x] Test mở group thành công.

Step progress: 100%

---

# 24. Step 16 — Mở composer

## Mục tiêu

Click vào vùng tạo bài viết trong Facebook Group.

## File

src/open-composer.js

## Selector ban đầu

Bot ban đầu tìm các text:

Viết gì đó
Tạo bài viết
Bạn đang nghĩ gì
Write something
Create post
What's on your mind

## Lỗi gặp phải

Giao diện thực tế hiển thị:

Bạn viết gì đi...

Do selector chưa có text này nên bot mở đúng group nhưng không mở được composer.

## Cách đã sửa

- [x] Bổ sung selector `Bạn viết gì đi`.
- [x] Ưu tiên tìm element có `role="button"`.
- [x] Không chỉ click text node.
- [x] Hỗ trợ tiếng Việt.
- [x] Hỗ trợ tiếng Anh.
- [x] Chờ composer dialog mở.
- [x] Tìm editor trong dialog.
- [x] Test composer mở thành công.

Ngoài ra:

- [x] File có thể nhận group từ JSON cũ.
- [x] File có thể nhận group object từ Supabase.
- [x] Flow Supabase không còn phụ thuộc vào `data/groups.json`.

Step progress: 100%

---

# 25. Step 17 — Điền nội dung JD

## Mục tiêu

Điền nguyên văn nội dung JD vào Facebook composer.

## Những việc đã hoàn thành

- [x] Click editor.
- [x] Điền JD bằng Playwright.
- [x] Giữ tiếng Việt.
- [x] Giữ xuống dòng.
- [x] Đọc lại nội dung sau khi điền.
- [x] Normalize line ending.
- [x] So sánh content thực tế với content Supabase.
- [x] Báo lỗi nếu content khác.
- [x] Test content được điền thành công.

Step progress: 100%

---

# 26. Step 18 — Upload ảnh

## Mục tiêu

Upload đúng ảnh theo position vào composer.

## Những việc đã hoàn thành

- [x] Lấy đường dẫn ảnh tuyệt đối.
- [x] Tìm `input[type="file"]`.
- [x] Ưu tiên input nhận image.
- [x] Upload bằng `setInputFiles`.
- [x] Chờ Facebook xử lý ảnh.
- [x] Tìm preview dạng blob.
- [x] Tìm preview từ Facebook CDN.
- [x] Tìm background-image preview.
- [x] Timeout tối đa 120 giây.
- [x] Không tiếp tục nếu không xác nhận được preview.
- [x] Test ảnh Content Creator hiển thị thành công.

Step progress: 100%

---

# 27. Step 19 — Chọn group theo số thứ tự

## Mục tiêu

Cho phép test riêng từng group.

## Command

node src/prepare-post.js 1 1

Ý nghĩa:

STT 1
Group thứ 1

Ví dụ group thứ hai:

node src/prepare-post.js 1 2

## Những việc đã hoàn thành

- [x] Nhận STT.
- [x] Nhận group number.
- [x] Validate group number.
- [x] Chuyển group number sang array index.
- [x] Báo lỗi nếu group number vượt danh sách.
- [x] Hiển thị group hiện tại.
- [x] Hiển thị tổng số group.
- [x] Test group 1.
- [x] Test group 2.

Step progress: 100%

---

# 28. Step 20 — Job lock

## Mục tiêu

Ngăn hai job cùng điều khiển Chrome Facebook.

## File

src/job-lock.js

## Runtime lock

runtime/facebook-post.lock

## Những việc đã hoàn thành

- [x] Tạo lock khi job bắt đầu.
- [x] Lưu process ID.
- [x] Lưu STT.
- [x] Lưu group number.
- [x] Lưu thời gian bắt đầu.
- [x] Chặn job thứ hai.
- [x] Báo PID của job đang chạy.
- [x] Xóa lock khi job hoàn thành.
- [x] Xóa lock khi job lỗi được xử lý.
- [x] Xử lý stale lock.
- [x] Có command kill process thủ công.
- [x] Có command xóa lock thủ công.

Command đóng bot:

kill <PID>

Nếu process không dừng:

kill -9 <PID>

Xóa lock:

rm -f runtime/facebook-post.lock

Đóng Chrome bot:

pkill -f "$HOME/.hermes/browser-profiles/facebook"

Step progress: 100%

---

# 29. Step 21 — Sửa lỗi CLI không chạy

## Lỗi gặp phải

Command:

node src/prepare-post.js 1 1

thoát ngay và không mở browser.

## Nguyên nhân

Đoạn kiểm tra direct execution không gọi function `run()` đúng cách.

## Cách đã sửa

Chuyển sang so sánh:

import.meta.url

với:

pathToFileURL(path.resolve(process.argv[1])).href

## Kết quả

- [x] File nhận đúng command.
- [x] `run()` được gọi.
- [x] Job lock được tạo.
- [x] Browser mở.
- [x] JD được điền.
- [x] Ảnh được upload.

Step progress: 100%

---

# 30. Step 22 — Progress tracking

## Mục tiêu

Lưu danh sách group đã hoàn thành để tránh đăng trùng.

## File code

src/post-progress.js

## File dữ liệu local

runtime/post-progress.json

## Dữ liệu lưu

STT
Danh sách group đã hoàn thành
Group number cuối
Thời gian cập nhật

## Những việc đã hoàn thành

- [x] Tạo progress file tự động.
- [x] Đọc progress theo STT.
- [x] Mark group đã hoàn thành.
- [x] Không thêm group trùng.
- [x] Lưu `lastGroupNumber`.
- [x] Lưu `updatedAt`.
- [x] Reset progress.
- [x] File progress không push lên GitHub.
- [x] Dùng temporary file trước khi rename.
- [x] Test mark group 1.
- [x] Test mark group 2.
- [x] Test reset progress.

Command xem trạng thái:

node src/post-progress.js status 1

Command reset:

node src/post-progress.js reset 1

Step progress: 100%

---

# 31. Step 23 — Chế độ `next`

## Mục tiêu

Không cần tự nhớ group number.

## Command

node src/prepare-post.js 1 next

## Flow

Đọc progress
→ lấy danh sách group
→ tìm group đầu tiên chưa hoàn thành
→ chuẩn bị hoặc đăng bài
→ mark progress

## Những việc đã hoàn thành

- [x] Đọc progress.
- [x] Chuyển danh sách đã hoàn thành thành Set.
- [x] Tìm group chưa hoàn thành đầu tiên.
- [x] Chọn đúng group tiếp theo.
- [x] Báo lỗi khi tất cả group đã hoàn thành.
- [x] Cho phép reset để chạy lại.
- [x] Hiển thị `x/17`.

Step progress: 100%

---

# 32. Step 24 — Tự động bấm nút Đăng

## Mục tiêu

Bot tự bấm Post sau khi content và ảnh đã sẵn sàng.

## Những việc đã hoàn thành

- [x] Tìm button có tên `Đăng`.
- [x] Tìm button có tên `Post`.
- [x] Tìm button bằng role.
- [x] Tìm button bằng aria-label.
- [x] Tìm button trong composer dialog.
- [x] Tìm button trên toàn page nếu cần.
- [x] Chờ button sẵn sàng.
- [x] Không click button bị ẩn.
- [x] Kiểm tra `aria-disabled`.
- [x] Kiểm tra native `disabled`.
- [x] Kiểm tra button có kích thước thật.
- [x] Click button Post.
- [x] Chờ composer đóng.
- [x] Phát hiện bài đang chờ duyệt.
- [x] Phát hiện Facebook error message.
- [x] Không update progress nếu không xác nhận được kết quả.

## Lỗi đã gặp

Facebook hiển thị nút Đăng màu xanh nhưng code báo disabled.

## Nguyên nhân

Có thể Facebook có nhiều element cùng chữ `Đăng`.

Code cũ lấy element đầu tiên và chọn nhầm button ẩn hoặc button chưa active.

## Cách đã sửa

Bot duyệt toàn bộ candidate và chỉ chọn button:

đang hiển thị
có kích thước thật
aria-disabled không phải true
native disabled không phải true

Step progress: 95%

Phần cần xác nhận thêm:

- [ ] Test lại auto-click Post sau selector mới.
- [ ] Xác nhận composer đóng sau khi đăng.
- [ ] Xác nhận progress được ghi đúng.

---

# 33. Step 25 — Batch chạy toàn bộ group

## Mục tiêu

Chạy toàn bộ group bằng một command.

## File

src/prepare-all.js

## Command

node src/prepare-all.js 1

## Flow

Đọc STT
→ lấy 17 group
→ đọc progress
→ bỏ qua group đã hoàn thành
→ xử lý group còn lại
→ group 1
→ group 2
→ group 3
→ ...
→ group 17

## Những việc đã hoàn thành

- [x] Nhận STT.
- [x] Lấy toàn bộ group.
- [x] Đọc progress hiện tại.
- [x] Bỏ qua group đã hoàn thành.
- [x] Chạy tuần tự từng group.
- [x] Không chạy nhiều browser song song.
- [x] Dừng batch nếu một group lỗi.
- [x] Hiển thị group bị lỗi.
- [x] Cho phép chạy lại command.
- [x] Tiếp tục từ group chưa hoàn thành.
- [x] Dùng job lock cho toàn batch.
- [x] Hiển thị batch progress.
- [x] Báo khi toàn bộ group hoàn thành.

Command tiếp tục batch:

node src/prepare-all.js 1

Command chạy lại từ đầu:

node src/post-progress.js reset 1
rm -f runtime/facebook-post.lock
pkill -f "$HOME/.hermes/browser-profiles/facebook"
node src/prepare-all.js 1

Step progress: 95%

Phần còn cần test:

- [ ] Auto-post thành công ở group đầu tiên.
- [ ] Bot tự đóng Chrome.
- [ ] Bot tự mở group tiếp theo.
- [ ] Test liên tục ít nhất 2–3 group.
- [ ] Test batch đủ 17 group.

---

# 34. Các file hiện có

facebook-group-posting/
│
├── package.json
├── package-lock.json
├── .gitignore
├── .env.example
├── README.md
│
├── src/
│   ├── browser.js
│   ├── facebook-session.js
│   ├── groups.js
│   ├── job-lock.js
│   ├── open-composer.js
│   ├── open-group.js
│   ├── positions.js
│   ├── post-data.js
│   ├── post-groups.js
│   ├── post-progress.js
│   ├── prepare-post.js
│   ├── prepare-all.js
│   └── supabase.js
│
├── data/
│   └── positions.json
│
├── assets/
│   └── positions/
│       └── content-creator.jpg
│
├── runtime/
│   ├── facebook-post.lock
│   └── post-progress.json
│
├── supabase/
│   ├── groups-schema.sql
│   └── groups-seed.sql
│
└── docs/
    └── PROGRESS.md

Lưu ý:

Các file trong `runtime/` chỉ xuất hiện khi bot chạy và không được push lên GitHub.

---

# 35. Command sử dụng hằng ngày

## Vào repo

cd ~/Desktop/facebook-group-posting

## Kiểm tra syntax

node --check src/prepare-post.js
node --check src/prepare-all.js
node --check src/job-lock.js
node --check src/post-progress.js

## Test một group cụ thể

node src/prepare-post.js 1 1

## Chạy group tiếp theo

node src/prepare-post.js 1 next

## Chạy toàn bộ group

node src/prepare-all.js 1

## Xem progress

node src/post-progress.js status 1

## Reset progress

node src/post-progress.js reset 1

## Xóa lock

rm -f runtime/facebook-post.lock

## Đóng Chrome bot

pkill -f "$HOME/.hermes/browser-profiles/facebook"

## Đóng process bot theo PID

kill <PID>

Nếu không dừng:

kill -9 <PID>

## Chạy lại toàn bộ từ đầu

cd ~/Desktop/facebook-group-posting
node src/post-progress.js reset 1
rm -f runtime/facebook-post.lock
pkill -f "$HOME/.hermes/browser-profiles/facebook"
node src/prepare-all.js 1

---

# 36. Trạng thái chức năng

| Chức năng | Trạng thái |
|---|---:|
| Repo GitHub | 100% |
| Node.js project | 100% |
| Playwright setup | 100% |
| Supabase connection | 100% |
| Đọc JD theo STT | 100% |
| Lấy position | 100% |
| Map position sang ảnh | 100% |
| Đọc danh sách group | 100% |
| Một JD gắn nhiều group | 100% |
| Mở Chrome profile riêng | 100% |
| Mở Facebook Group | 100% |
| Mở composer | 100% |
| Điền JD | 100% |
| Upload ảnh | 100% |
| Chọn group theo số | 100% |
| Chế độ `next` | 100% |
| Job lock | 100% |
| Progress tracking | 100% |
| Tìm nút Đăng | 100% |
| Click nút Đăng | 95% |
| Xác nhận đăng thành công | 95% |
| Chạy batch nhiều group | 95% |
| Test đủ 17 group | 0% |

---

# 37. Việc còn lại

## Việc 1 — Test auto-post sau selector mới

Chạy:

node src/post-progress.js reset 1
rm -f runtime/facebook-post.lock
pkill -f "$HOME/.hermes/browser-profiles/facebook"
node src/prepare-post.js 1 1

Điều kiện đạt:

- Nút Đăng được tìm thấy.
- Bot tự click.
- Composer đóng.
- Terminal báo `submitted` hoặc `pending_approval`.
- Progress thành `1/17`.
- Chrome đóng.
- Process kết thúc.

## Việc 2 — Test batch 2–3 group

Chạy:

node src/prepare-all.js 1

Điều kiện đạt:

- Group 1 được đăng.
- Bot đóng browser.
- Bot tự mở group 2.
- Group 2 được đăng.
- Bot tự mở group 3.
- Progress tăng đúng.

## Việc 3 — Test đủ danh sách

Sau khi test 2–3 group ổn định, chạy toàn bộ 17 group.

## Việc 4 — Cập nhật log lỗi thực tế

Ghi lại các group có:

- Không cho đăng.
- Bắt chọn topic.
- Bắt xác nhận nội quy.
- Bài phải chờ duyệt.
- Composer khác giao diện.
- Nút Đăng có cấu trúc khác.
- Không còn là thành viên.

---

# 38. Điều kiện Phase 1 đạt 100%

Phase 1 được xem là hoàn thành khi:

- [x] Bot đọc đúng JD.
- [x] Bot lấy đúng ảnh.
- [x] Bot lấy đúng danh sách group.
- [x] Bot mở đúng group.
- [x] Bot mở đúng composer.
- [x] Bot điền đúng content.
- [x] Bot upload đúng ảnh.
- [ ] Bot tự bấm Đăng ổn định.
- [ ] Bot xác nhận kết quả đăng.
- [ ] Bot lưu progress sau khi đăng.
- [ ] Bot tự chuyển sang group tiếp theo.
- [ ] Batch chạy ổn định ít nhất 2–3 group.
- [ ] Test đầy đủ 17 group.

Current Phase 1 progress: 98%

---

# 39. Changelog

## 27/07/2026

- Chốt bot chạy bằng command.
- Loại bỏ AI khỏi browser automation.
- Tạo GitHub repository.
- Clone repo về Mac.
- Khởi tạo Node.js project.
- Cài Playwright Core.
- Tạo `.gitignore`.
- Tạo cấu hình environment.
- Tạo Chrome profile riêng.
- Thử kết nối Chrome bằng CDP port 9223.
- Phát hiện lỗi `connectOverCDP`.
- Chuyển sang persistent Chrome context.
- Test mở browser thành công.
- Tạo Supabase table cho JD.
- Tạo Supabase table cho Facebook Group.
- Tạo bảng nối JD với group.
- Import danh sách group.
- Loại bỏ group trùng URL.
- Gắn JD Content Creator với 17 group.
- Lưu ảnh Content Creator trong GitHub.
- Tạo position image mapping.
- Tạo Supabase data loader.
- Tạo position resolver.
- Gộp JD và ảnh.
- Đọc danh sách group theo STT.
- Mở Facebook Group.
- Kiểm tra Facebook session.
- Mở composer.
- Sửa selector theo text `Bạn viết gì đi...`.
- Điền JD thành công.
- Upload ảnh thành công.
- Tạo group number selection.
- Tạo job lock.
- Sửa lỗi CLI không gọi `run()`.
- Tạo progress tracking.
- Tạo chế độ `next`.
- Tạo batch chạy toàn bộ group.
- Thêm logic tự tìm nút Đăng.
- Phát hiện lỗi chọn nhầm button disabled.
- Update logic tìm button đang hiển thị và enabled.
- Chuẩn bị command chạy toàn bộ danh sách.

---

# 40. Current work

Current step:

Test auto-post và batch tuần tự

Current objective:

Xác nhận bot tự click Đăng thành công,
đóng browser,
ghi progress,
và tự chuyển sang group tiếp theo.

Current blocker:

Cần test lại selector nút Đăng vừa được update.

Next action:

cd ~/Desktop/facebook-group-posting
node src/post-progress.js reset 1
rm -f runtime/facebook-post.lock
pkill -f "$HOME/.hermes/browser-profiles/facebook"
node src/prepare-post.js 1 1
