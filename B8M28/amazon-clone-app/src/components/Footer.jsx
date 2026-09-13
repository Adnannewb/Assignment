import amazonlogo from "../assets/amazon logo.png";

export default function Footer() {
  return (
    <footer className="bg-[rgb(35_47_62)] text-gray-300 py-10 px-6">
      <div className="max-w-7xl mx-auto grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8">
        
        <div className="flex flex-col items-start space-y-2">
          <a href="#" className="p-1 -ml-1">
            <img
              src={amazonlogo}
              alt="Amazon Logo"
              className="h-10 max-w-full object-contain"
            />
          </a>
          <span className="font-semibold text-white">ACME Industries Ltd.</span>
          <p className="text-1xl text-white">
            Providing reliable tech since 1992
          </p>
        </div>

        {/* Services */}
        <div className="flex flex-col">
          <h2 className="text-gray-400 font-bold text-2xl tracking-wide uppercase mb-3">
            Services
          </h2>
          <ul className="space-y-2 text-1xl">
            <li><a href="#" className="hover:underline text-white">Branding</a></li>
            <li><a href="#" className="hover:underline text-white ">Design</a></li>
            <li><a href="#" className="hover:underline text-white">Marketing</a></li>
            <li><a href="#" className="hover:underline text-white">Advertisement</a></li>
          </ul>
        </div>

        {/* Company */}
        <div className="flex flex-col">
          <h2 className="text-gray-400 font-bold text-2xl tracking-wide uppercase mb-3">
            Company
          </h2>
          <ul className="space-y-2 text-1xl">
            <li><a href="#" className="hover:underline text-white">About us</a></li>
            <li><a href="#" className="hover:underline text-white">Contact</a></li>
            <li><a href="#" className="hover:underline text-white">Jobs</a></li>
            <li><a href="#" className="hover:underline text-white">Press kit</a></li>
          </ul>
        </div>

        {/* Legal */}
        <div className="flex flex-col">
          <h2 className="text-gray-400 font-bold text-2xl tracking-wide uppercase mb-3">
            Legal
          </h2>
          <ul className="space-y-2 text-1xl">
            <li><a href="#" className="hover:underline text-white">Terms of use</a></li>
            <li><a href="#" className="hover:underline text-white">Privacy policy</a></li>
            <li><a href="#" className="hover:underline text-white">Cookie policy</a></li>
          </ul>
        </div>
      </div>
    </footer>
  );
}