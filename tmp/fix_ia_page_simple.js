const fs = require('fs');
const target = './src/pages/SuperAdmin/SuperIAPage.tsx';
let content = fs.readFileSync(target, 'utf8');
const search = '{actions.map((item) => (';
const index = content.indexOf(search);
const end = '</tbody>';
const nextTbody = content.indexOf(end, index);
const replacement = `{actions.map((item: any, i: number) => {
    const IconComponent = item.icon || Bot || Cpu;
    return (
       <tr key={item.action || i} className="hover:bg-slate-800/40 transition-colors group">
          <td className="px-8 py-5">
             <div className="flex items-center gap-4">
                <div className="p-3 bg-slate-900/50 rounded-xl text-slate-500 group-hover:text-purple-400 transition-colors">
                   <IconComponent size={18} />
                </div>
                <span className="text-sm font-black text-slate-200 uppercase tracking-widest">{item.action || item.nome}</span>
             </div>
          </td>
          <td className="px-8 py-5 font-bold text-slate-400">{item.calls}</td>
          <td className="px-8 py-5 font-bold text-slate-400">{item.tokens || 'N/A'}</td>
          <td className="px-8 py-5 text-right font-black text-white">{typeof item.cost === 'number' ? \`R$ \${item.cost.toFixed(2)}\` : item.cost}</td>
       </tr>
    );
})}`;
const final = content.substring(0, index) + replacement + content.substring(nextTbody);
fs.writeFileSync(target, final);
console.log('Fixed');
