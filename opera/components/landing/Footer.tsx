import React from "react";

export default function Footer() {
  return (
    <footer className="bg-dark-nav py-24 px-6">
      <div className="max-w-7xl mx-auto grid grid-cols-4 gap-12 text-sm text-white/60">
        <div><h4 className="font-bold text-white mb-4">Product</h4><ul className="space-y-2"><li>Features</li><li>Pricing</li></ul></div>
        <div><h4 className="font-bold text-white mb-4">Company</h4><ul className="space-y-2"><li>About</li><li>Careers</li></ul></div>
        <div><h4 className="font-bold text-white mb-4">Resources</h4><ul className="space-y-2"><li>Blog</li><li>Support</li></ul></div>
        <div><h4 className="font-bold text-white mb-4">Legal</h4><ul className="space-y-2"><li>Privacy</li><li>Terms</li></ul></div>
      </div>
    </footer>
  );
}
