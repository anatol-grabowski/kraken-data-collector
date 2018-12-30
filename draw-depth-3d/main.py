import ctypes
import sys

sys.path.append('..')

import pyglet
from pyglet.gl import *

from pywavefront import visualization
import pywavefront

import numpy as np

pos = np.array([0.0, 0.0, -3.0])
vel = np.array([0.0, 0.0, 0.0])
rotation_x = 0
rotation_y = 0
meshes = pywavefront.Wavefront('box.obj')
window = pyglet.window.Window()
window.set_exclusive_mouse(True)
lightfv = ctypes.c_float * 4


@window.event
def on_resize(width, height):
    glMatrixMode(GL_PROJECTION)
    glLoadIdentity()
    gluPerspective(60., float(width)/height, 1., 100.)
    glMatrixMode(GL_MODELVIEW)
    return True


@window.event
def on_draw():
    window.clear()
    glLoadIdentity()

    glLightfv(GL_LIGHT0, GL_POSITION, lightfv(-1.0, 1.0, 1.0, 0.0))
    glEnable(GL_LIGHT0)

    glTranslated(*pos)
    glRotatef(rotation_x, 0.0, 1.0, 0.0)
    glRotatef(rotation_y, 1.0, 0.0, 0.0)
    # glRotatef(45.0, 0.0, 0.0, 1.0)

    glEnable(GL_LIGHTING)

    visualization.draw(meshes)

@window.event
def on_mouse_press(x, y, button, modifiers):
    pass

@window.event
def on_mouse_release(x, y, button, modifiers):
    pass

@window.event
def on_mouse_drag(x, y, dx, dy, buttons, modifiers):
    pass

@window.event
def on_mouse_motion(x, y, dx, dy):
    global rotation_x, rotation_y
    sens = 0.2
    rotation_x += dx * sens
    rotation_y -= dy * sens

@window.event
def on_key_press(symbol, modifiers):
    speed = 1
    if chr(symbol) == 'w':
        vel[2] = speed
    if chr(symbol) == 's':
        vel[2] = -speed

@window.event
def on_key_release(symbol, modifiers):
    if chr(symbol) == 'w' and vel[2] > 0:
        vel[2] = 0
    if chr(symbol) == 's' and vel[2] < 0:
        vel[2] = 0
    print(symbol, chr(symbol))
    pass


def update(dt):
    global pos
    pos += vel * dt

pyglet.clock.schedule(update)
pyglet.app.run()
