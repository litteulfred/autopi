#!/usr/bin/env python
#
# interface graphique autoradio
#
# ###############################

import gtk
import webkit
import gobject
import os

gobject.threads_init()

# creation de la fenetre principale
fenetre = gtk.Window()
fenetre.set_default_size(1024, 600)
fenetre.connect("destroy", lambda a: gtk.main_quit())
fenetre.set_title("NAVIGO")

# creation du browser HTML
browser = webkit.WebView()
print " [IHMGPS] Activation du browser"

myhost = os.uname()[1]
if myhost == 'Dev-Debian':
	browser.open("http://192.168.56.2:8120/html/navigo.html")
else:
	browser.open("http://127.0.0.1:8120/html/navigo.html")

fenetre.add(browser)
fenetre.show_all()
gtk.main()
