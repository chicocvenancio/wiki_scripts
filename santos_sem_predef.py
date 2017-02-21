# -*- coding: utf-8  -*-
# author Chico Venancio 
# License MIT License
# Copyright (c) 2017 Francisco Venancio

# Permission is hereby granted, free of charge, to any person obtaining a copy
# of this software and associated documentation files (the "Software"), to deal
# in the Software without restriction, including without limitation the rights
# to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
# copies of the Software, and to permit persons to whom the Software is
# furnished to do so, subject to the following conditions:

# The above copyright notice and this permission notice shall be included in all
# copies or substantial portions of the Software.

# THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
# IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
# FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
# AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
# LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
# OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
# SOFTWARE.

import pywikibot
from pywikibot import pagegenerators

site = pywikibot.Site()

cat = pywikibot.Category(site,'Categoria:Santos')
gen = pagegenerators.CategorizedPageGenerator(cat, recurse=True, content=True)

lista = ''
for page in gen:
    if '{{info/santo' not in page.text.lower():
        lista += '* ' + page.title(asLink=True) + '\n'

page = pywikibot.Page(site, 'Usuário:Jbribeiro1/Categoria:Santos sem predefinição')
page.text = lista
page.save('Lista de páginas na [[:Categoria:Santos]] sem a [[Predefinição:Info/Santo|predefinição adequada]].')