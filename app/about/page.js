export default function AboutPage() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12">
      <div className="max-w-4xl mx-auto px-4">
        <h1 className="text-3xl font-bold mb-8 text-gray-900 dark:text-white">Về Trading Journal</h1>
        
        <div className="card mb-6">
          <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">Tổng quan dự án</h2>
          <p className="mb-4 text-gray-700 dark:text-gray-300">
            Trading Journal là một ứng dụng web toàn diện được thiết kế cho các nhà đầu tư cá nhân trên thị trường chứng khoán.
            Nó giúp bạn ghi chép, phân tích và học hỏi từ các hoạt động giao dịch của mình, đồng thời tạo điều kiện
            chia sẻ chiến lược giao dịch trong cộng đồng.
          </p>
          <p className="text-gray-700 dark:text-gray-300">
            Được xây dựng với các công nghệ web hiện đại, ứng dụng này cung cấp một nền tảng an toàn và thân thiện
            để cải thiện hiệu suất giao dịch của bạn theo thời gian.
          </p>
        </div>
        
        <div className="card mb-6">
          <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">Tính năng chính</h2>
          <ul className="list-disc pl-5 space-y-2 text-gray-700 dark:text-gray-300">
            <li>
              <span className="font-medium text-gray-900 dark:text-white">Quản lý giao dịch:</span> Ghi lại các giao dịch mua/bán
              với chi tiết về giá, số lượng, phí và thuế.
            </li>
            <li>
              <span className="font-medium text-gray-900 dark:text-white">Phân tích hiệu suất:</span> Trực quan hóa hiệu suất đầu tư
              của bạn với các chỉ số và biểu đồ chi tiết.
            </li>
            <li>
              <span className="font-medium text-gray-900 dark:text-white">Nhật ký cá nhân:</span> Ghi lại suy nghĩ,
              cảm xúc và bài học từ mỗi giao dịch.
            </li>
            <li>
              <span className="font-medium text-gray-900 dark:text-white">Chia sẻ chiến lược:</span> Chia sẻ và khám phá các chiến lược giao dịch
              với các nhà đầu tư khác.
            </li>
            <li>
              <span className="font-medium text-gray-900 dark:text-white">Xác thực an toàn:</span> Dữ liệu của bạn được bảo vệ
              với xác thực cục bộ an toàn.
            </li>
          </ul>
        </div>
        
        <div className="card">
          <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">Công nghệ sử dụng</h2>
          <p className="mb-4 text-gray-700 dark:text-gray-300">
            Ứng dụng này được xây dựng bằng các công nghệ sau:
          </p>
          <ul className="list-disc pl-5 space-y-1 text-gray-700 dark:text-gray-300">
            <li>
              <span className="font-medium text-gray-900 dark:text-white">Frontend:</span> Next.js (React Framework)
            </li>
            <li>
              <span className="font-medium text-gray-900 dark:text-white">Backend:</span> Next.js API Routes
            </li>
            <li>
              <span className="font-medium text-gray-900 dark:text-white">Database:</span> SQLite via Prisma ORM
            </li>
            <li>
              <span className="font-medium text-gray-900 dark:text-white">Authentication:</span> NextAuth.js
            </li>
            <li>
              <span className="font-medium text-gray-900 dark:text-white">Styling:</span> Tailwind CSS
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
} 