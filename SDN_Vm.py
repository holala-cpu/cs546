# Echo server program
import socket
from pox.core import core
import pox.openflow.libopenflow_01 as of


def _handle_PacketIn (self, event):
    msg = of.ofp_packet_out(data=event.ofp)
    msg.actions.append(of.ofp_action_output(port=of.OFPP_FLOOD))
    event.connection.send(msg)


if __name__ == '__main__' :
    HOST = '0.0.0.0'                               # Symbolic name meaning all available interfaces
    PORT = 50007                                   # Arbitrary non-privileged port
    s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    s.bind((HOST, PORT))
    s.listen(1)
    print 'Listening...'
    conn, addr = s.accept()
    print 'Connected by', addr

    while 1:
        data = conn.recv(1024)
        print 'data = ', data
        if data == 'OK':
            print 'YES'
            core.openflow.addListenerByName("PacketIn", self._handle_PacketIn)
        if not data: break
        conn.sendall(data)
    conn.close()    


