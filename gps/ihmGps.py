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
fenetre.set_title("GPS")

# creation du browser HTML
browser = webkit.WebView()
print " [IHMGPS] Activation du browser"
browser.open("https://www.netflix.com/browse")

fenetre.add(browser)
fenetre.show_all()
gtk.main()

