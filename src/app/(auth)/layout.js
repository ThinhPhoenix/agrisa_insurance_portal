"use client";
import Assets from "@/assets";
import Link from "next/link";

export default function Layout({ children }) {
  return (
    <div className="min-h-screen flex bg-secondary-100">
      <div className="hidden lg:block lg:w-2/5 relative">
        <img
          src={Assets.SideBackground.src}
          alt="Agriculture Background"
          className="w-full h-full object-cover"
        />
      </div>

      <div className="flex-1 lg:w-3/5 flex flex-col">
        <header className="w-full py-4 px-6 border-b border-secondary-200">
          <div className="flex justify-between items-center max-w-6xl mx-auto">
            <div className="flex items-center">
              <img
                src={Assets.Agrisa.src}
                alt="Agrisa Logo"
                className="h-10 w-auto"
              />
            </div>
            <nav className="hidden md:flex items-center space-x-8">
              <Link
                href="/"
                className="text-primary-600 hover:text-primary-800 text-sm font-medium"
              >
                Trang chủ
              </Link>
              <Link
                href="/about"
                className="text-primary-600 hover:text-primary-800 text-sm font-medium"
              >
                Về chúng tôi
              </Link>
              <Link
                href="/pricing"
                className="text-primary-600 hover:text-primary-800 text-sm font-medium"
              >
                Bảng giá
              </Link>
            </nav>
          </div>
        </header>

        {children}

        <footer className="w-full py-4 px-6 border-t border-secondary-200">
          <div className="flex flex-wrap justify-center gap-6 text-sm">
            <Link href="/#">Trợ giúp</Link>
            <Link href="/#">Liên hệ</Link>
            <Link href="/terms">Điều khoản sử dụng</Link>
            <Link href="/#">Chính sách bảo mật</Link>
          </div>
        </footer>
      </div>
    </div>
  );
}
