# %%
import matplotlib.pyplot as plt
import numpy as np

# importing Qiskit
from qiskit import IBMQ, Aer, assemble, transpile
from qiskit import QuantumCircuit, ClassicalRegister, QuantumRegister
from qiskit_textbook.tools import array_to_latex


from qiskit.visualization import plot_histogram

# %%
simulator = Aer.get_backend('aer_simulator')
# 必须要提前先导入

# %%
# Qiskit的Grover Algorithm原本的电路画出来

n = 2
example_circuit = QuantumCircuit(n)

example_circuit.h(0)
example_circuit.h(1)
example_circuit.cz(0,1)  # Oracle
# Diffusion operator (U_s)
example_circuit.h([0,1])
example_circuit.z([0,1])
example_circuit.cz(0,1)
example_circuit.h([0,1])
example_circuit.draw()
example_circuit.draw()


# %%
# 构建分来的 gate 的电路

N = 2
circuit = QuantumCircuit(N)

circuit.h([0])
circuit.save_statevector('psi0')
circuit.h(1)
circuit.save_statevector('psi1')
circuit.cz(0,1)  # Oracle
circuit.save_statevector('psi2')
# Diffusion operator (U_s)
circuit.h(0)
circuit.save_statevector('psi3')
circuit.h(1)
circuit.save_statevector('psi4')
circuit.z(0)
circuit.save_statevector('psi5')
circuit.z(1)
circuit.save_statevector('psi6')
circuit.cz(0,1)
circuit.save_statevector('psi7')
circuit.h(0)
circuit.save_statevector('psi8')
circuit.h(1)
circuit.save_statevector('psi9')
circuit.save_statevector()

circuit.draw()


# %%
# execute
result = simulator.run(circuit).result()
data = result.data()

psi9 = data['psi9']
display(psi9.draw(output = 'latex'))

# %%

array_to_latex(psi9)

# %%

counts = result.get_counts()
plot_histogram(counts)

# %%
for i in range(10):

    psi = 'psi{}'.format(i)

    print(psi)
    array_to_latex(data[psi])


