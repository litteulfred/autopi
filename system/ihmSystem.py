#!/usr/bin/env python
#
# interface graphique autoradio
#
# ###############################

import gtk
import webkit
import gobject

gobject.threads_init()

# creation de la fenetre principale
fenetre = gtk.Window()
fenetre.set_default_size(1024, 600)
fenetre.connect("destroy", lambda a: gtk.main_quit())
fenetre.set_title("AUTORADIO SYSTEM")

# creation du browser HTML
browser = webkit.WebView()
print "Activation du browser"
browser.open("http://127.0.0.1:8120/html/system.html")

fenetre.add(browser)
fenetre.show_all()
gtk.main()
