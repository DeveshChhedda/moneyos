"""Optional: rebuilds index.html from src/. Only needed if you edit the source files.
Requires Python 3 and Node.js (Node is used once to inline the icons).
Usage: python3 build.py"""
import re,subprocess,json
css=open('src/style.css').read()
js='\n'.join(open('src/'+f).read() for f in ['core.js','ui.js','views.js','views2.js','forms.js','main.js'])
html=open('src/shell.html').read()
# inline icons: run node to render I(name)
names=sorted(set(re.findall(r'%([a-z]+)',html)))
ui=open('src/ui.js').read()
icon_js=ui[ui.index('const I ='):ui.index('/* ================= toast')]
out=subprocess.run(['node','-e',icon_js+'\nconsole.log(JSON.stringify(Object.fromEntries(%s.map(n=>[n,I(n)]))))'%json.dumps(names)],capture_output=True,text=True,check=True).stdout
icons=json.loads(out)
for n in sorted(names,key=len,reverse=True):
    html=html.replace('%'+n,icons[n])
html=html.replace('/*CSS*/',css).replace('/*JS*/',js)
open('index.html','w').write(html)
print(len(html)//1024,'KB')
