---
title: "附录"
weight: 71
description: "A. Coulomb规范下的推迟电场；B. 横向与纵向Delta函数；C. 光探测、正规序与因果性。"
---

## Appendices

## A. Retarded Electric Field in the Coulomb Gauge

The expression (1.3.46) for the electric field derived in the Coulomb gauge is identical to the manifestly retarded expression obtained in the Lorentz gauge, in spite of the appearance of the static, nonretarded Coulomb field. To show this, it is convenient to write

$$
\mathbf{E} (\mathbf{r}, t) = \int_{- \infty} ^{\infty} d \omega \tilde{\mathbf{E}} (\mathbf{r}, \omega) e^{- i \omega t}\tag{A.1}
$$

and, likewise, for $\rho ( \mathbf{r} , t )$ and $\mathbf{J} ( \mathbf{r} , t )$ . Then, (1.3.45) and (1.3.46) imply

$$
\tilde{\mathbf{E}} (\mathbf{r}, \omega) = - \frac{1}{4 \pi \epsilon_{0}} \nabla \int d^{3} r^{\prime} \frac{\tilde{\rho} (\mathbf{r} ^{\prime} , \omega) e^{i \omega | \mathbf{r} - \mathbf{r} ^{\prime} | / c}}{| \mathbf{r} - \mathbf{r} ^{\prime} |} + \frac{i \mu_{0} \omega}{4 \pi} \int d^{3} r^{\prime} \frac{\tilde{\mathbf{J}} (\mathbf{r} ^{\prime} , \omega) e^{i \omega | \mathbf{r} - \mathbf{r} ^{\prime} | / c}}{| \mathbf{r} - \mathbf{r} ^{\prime} |}\tag{A.2}
$$

and

$$
\tilde{\mathbf{E}} (\mathbf{r}, \omega) = - \frac{1}{4 \pi \epsilon_{0}} \nabla \int d^{3} r^{\prime} \frac{\tilde{\rho} (\mathbf{r} ^{\prime} , \omega)}{| \mathbf{r} - \mathbf{r} ^{\prime} |} + \frac{i \mu_{0} \omega}{4 \pi} \int d^{3} r^{\prime} \frac{\tilde{\mathbf{J}} ^{\perp} (\mathbf{r} ^{\prime} , \omega) e^{i \omega | \mathbf{r} - \mathbf{r} ^{\prime} | / c}}{| \mathbf{r} - \mathbf{r} ^{\prime} |}\tag{A.3}
$$

in the Lorentz and Coulomb gauges, respectively. We use the identity $\tilde{\mathbf{J}} ^{\perp} = \tilde{\mathbf{J}} - \tilde{\mathbf{J}} ^{\|}$ to express (A.3) in the form

$$
\begin{array}{r} \mathbf{E} (\mathbf{r}, \omega) = - \frac{1}{4 \pi \epsilon_{0}} \nabla \int d^{3} r^{\prime} \frac{\tilde{\rho} (\mathbf{r} ^{\prime} , \omega)}{| \mathbf{r} - \mathbf{r} ^{\prime} |} + \frac{i \mu_{0} \omega}{4 \pi} \int d^{3} r^{\prime} \frac{\tilde{\mathbf{J}} (\mathbf{r} ^{\prime} , \omega) e^{i \omega | \mathbf{r} - \mathbf{r} ^{\prime} | / c}}{| \mathbf{r} - \mathbf{r} ^{\prime} |} \\ - \frac{i \mu_{0} \omega}{4 \pi} \int d^{3} r^{\prime} \frac{\tilde{\mathbf{J}} ^{\parallel} (\mathbf{r} ^{\prime} , \omega) e^{i \omega | \mathbf{r} - \mathbf{r} ^{\prime} | / c}}{| \mathbf{r} - \mathbf{r} ^{\prime} |}. \end{array}\tag{A.4}
$$

Denote the third term by X and use (1.3.41) and the continuity equation (1.1.6) to express it as

$$
\begin{array}{r} X = - \frac{i \mu_{0} \omega}{4 \pi} \int d^{3} r^{\prime} \frac{e^{i \omega | \mathbf{r} - \mathbf{r} ^{\prime} | / c}}{| \mathbf{r} - \mathbf{r} ^{\prime} |} \left(\frac{- 1}{4 \pi}\right) \nabla^{\prime} \int d^{3} r^{\prime \prime} \frac{\nabla^{\prime \prime} \cdot \tilde{\mathbf{J}} (\mathbf{r} ^{\prime \prime} , \omega)}{| \mathbf{r} ^{\prime} - \mathbf{r} ^{\prime \prime} |} \\ = - \frac{\mu_{0} \omega^{2}}{(4 \pi) ^{2}} \int d^{3} r^{\prime} \frac{e^{i \omega | \mathbf{r} - \mathbf{r} ^{\prime} | / c}}{| \mathbf{r} - \mathbf{r} ^{\prime} |} \nabla^{\prime} \int d^{3} r^{\prime \prime} \frac{\tilde{\rho} (\mathbf{r} ^{\prime \prime} , \omega)}{| \mathbf{r} ^{\prime} - \mathbf{r} ^{\prime \prime} |}. \end{array}\tag{A.5}
$$

Next, we use the identity

$$
\left(\nabla^{\prime 2} + \frac{\omega^{2}}{c^{2}}\right) \frac{e^{i \omega | \mathbf{r} - \mathbf{r} ^{\prime} | / c}}{| \mathbf{r} - \mathbf{r} ^{\prime} |} = - 4 \pi \delta^{3} (\mathbf{r} - \mathbf{r} ^{\prime})\tag{A.6}
$$

to write

$$
\begin{array}{l} X = \frac{\mu_{0} c^{2}}{(4 \pi) ^{2}} \int d^{3} r^{\prime} \left[ \nabla^{\prime 2} \frac{e^{i \omega | \mathbf{r} - \mathbf{r} ^{\prime} | / c}}{| \mathbf{r} - \mathbf{r} ^{\prime} |} + 4 \pi \delta^{3} (\mathbf{r} - \mathbf{r} ^{\prime}) \right] \nabla^{\prime} \int d^{3} r^{\prime \prime} \frac{\tilde{\rho} (\mathbf{r} ^{\prime \prime} , \omega)}{| \mathbf{r} ^{\prime} - \mathbf{r} ^{\prime \prime} |} \\ = \frac{1}{4 \pi} \frac{1}{4 \pi \epsilon_{0}} \int d^{3} r^{\prime} \nabla^{\prime 2} \Big (\frac{e^{i \omega | \mathbf{r} - \mathbf{r} ^{\prime} | / c}}{| \mathbf{r} - \mathbf{r} ^{\prime} |} \Big) \nabla^{\prime} \int d^{3} r^{\prime \prime} \frac{\tilde{\rho} (\mathbf{r} ^{\prime \prime} , \omega)}{| \mathbf{r} ^{\prime} - \mathbf{r} ^{\prime \prime} |} \\ + \frac{1}{4 \pi \epsilon_{0}} \int d^{3} r^{\prime} \frac{\tilde{\rho} (\mathbf{r} ^{\prime} , \omega)}{| \mathbf{r} - \mathbf{r} ^{\prime} |}. \end{array}\tag{A.7}
$$

Integration by parts, together with

$$
\nabla^{\prime 2} \left(\frac{1}{| \mathbf{r} ^{\prime} - \mathbf{r} ^{\prime \prime} |}\right) = - 4 \pi \delta^{3} (\mathbf{r} ^{\prime} - \mathbf{r} ^{\prime \prime}),\tag{A.8}
$$

then yields

$$
\begin{array}{l} X = \frac{1}{4 \pi} \frac{1}{4 \pi \epsilon_{0}} \int d^{3} r^{\prime} \nabla \frac{e^{i \omega | \mathbf{r} - \mathbf{r} ^{\prime} | / c}}{| \mathbf{r} - \mathbf{r} ^{\prime} |} \nabla^{\prime 2} \int d^{3} r^{\prime \prime} \frac{\tilde{\rho} (\mathbf{r} ^{\prime \prime} , \omega)}{| \mathbf{r} ^{\prime} - \mathbf{r} ^{\prime \prime} |} + \frac{1}{4 \pi \epsilon_{0}} \int d^{3} r^{\prime} \frac{\tilde{\rho} (\mathbf{r} ^{\prime} , \omega)}{| \mathbf{r} - \mathbf{r} ^{\prime} |}. \\ = - \frac{1}{4 \pi \epsilon_{0}} \nabla \int d^{3} r^{\prime} \frac{\tilde{\rho} (\mathbf{r} ^{\prime} , \omega) e^{i \omega | \mathbf{r} - \mathbf{r} ^{\prime} | / c}}{| \mathbf{r} - \mathbf{r} ^{\prime} |} + \frac{1}{4 \pi \epsilon_{0}} \int d^{3} r^{\prime} \frac{\tilde{\rho} (\mathbf{r} ^{\prime} , \omega)}{| \mathbf{r} - \mathbf{r} ^{\prime} |}. \end{array}\tag{A.9}
$$

The (instantaneous) second term cancels the (instantaneous) first term in (A.4), which therefore reduces to

$$
\mathbf{E} (\mathbf{r}, \omega) = \frac{i \mu_{0} \omega}{4 \pi} \int d^{3} r^{\prime} \frac{\tilde{\mathbf{J}} (\mathbf{r} ^{\prime} , \omega) e^{i \omega | \mathbf{r} - \mathbf{r} ^{\prime} | / c}}{| \mathbf{r} - \mathbf{r} ^{\prime} |} - \frac{1}{4 \pi \epsilon_{0}} \nabla \int d^{3} r^{\prime} \frac{\tilde{\rho} (\mathbf{r} ^{\prime} , \omega) e^{i \omega | \mathbf{r} - \mathbf{r} ^{\prime} | / c}}{| \mathbf{r} - \mathbf{r} ^{\prime} |},\tag{A.10}
$$

which is identical to the electric field (A.2) derived in the Lorentz gauge.

## B. Transverse and Longitudinal Delta Functions

Consider the vector field

$$
\mathbf{G} (\mathbf{r}) \equiv \frac{1}{4 \pi} \nabla \times \nabla \times \int d^{3} r^{\prime} \frac{\mathbf{F} (\mathbf{r} ^{\prime})}{| \mathbf{r} - \mathbf{r} ^{\prime} |}\tag{B.1}
$$

obtained from another vector field $\mathbf{F} ( \mathbf{r} )$ . Using the identities $\nabla \times \nabla \times \mathbf{C} = \nabla ( \nabla \cdot \mathbf{C} ) -$ $\nabla^{2} \mathbf{C}$ , and $\nabla^{2} ( 1 / | \mathbf{r} - \mathbf{r} ^{\prime} | ) = - 4 \pi \delta^{3} ( \mathbf{r} - \mathbf{r} ^{\prime} )$ , we obtain, for any point $\mathbf{r} ,$

$$
\begin{array}{r l} & {4 \pi \mathbf{G} (\mathbf{r}) = \nabla \int d^{3} r^{\prime} \mathbf{F} (\mathbf{r} ^{\prime}) \cdot \nabla \frac{1}{| \mathbf{r} - \mathbf{r} ^{\prime} |} + 4 \pi \mathbf{F} (\mathbf{r})} \\ & {\qquad = - \nabla \int d^{3} r^{\prime} \mathbf{F} (\mathbf{r} ^{\prime}) \cdot \nabla^{\prime} \frac{1}{| \mathbf{r} - \mathbf{r} ^{\prime} |} + 4 \pi \mathbf{F} (\mathbf{r})} \\ & {\qquad = \nabla \int d^{3} r^{\prime} \frac{\nabla^{\prime} \cdot \mathbf{F} (\mathbf{r} ^{\prime})}{| \mathbf{r} - \mathbf{r} ^{\prime} |} + 4 \pi \mathbf{F} (\mathbf{r}),} \end{array}\tag{B.2}
$$

after integrating by parts and assuming $\mathbf{F} ( \mathbf{r} )$ vanishes suficiently rapidly at infinity that the “boundary” term is zero. Therefore,

$$
\begin{array}{l} \mathbf{F} (\mathbf{r}) = \mathbf{G} (\mathbf{r}) - \frac{1}{4 \pi} \nabla \int d^{3} r^{\prime} \frac{\nabla^{\prime} \cdot \mathbf{F} (\mathbf{r} ^{\prime})}{| \mathbf{r} - \mathbf{r} ^{\prime} |} \\ \qquad = \frac{1}{4 \pi} \nabla \times \nabla \times \int d^{3} r^{\prime} \frac{\mathbf{F} (\mathbf{r} ^{\prime})}{| \mathbf{r} - \mathbf{r} ^{\prime} |} - \frac{1}{4 \pi} \nabla \int d^{3} r^{\prime} \frac{\nabla^{\prime} \cdot \mathbf{F} (\mathbf{r} ^{\prime})}{| \mathbf{r} - \mathbf{r} ^{\prime} |} \\ \qquad = \mathbf{F} ^{\perp} (\mathbf{r}) + \mathbf{F} ^{\parallel} (\mathbf{r}), \end{array}\tag{B.3}
$$

which is the Helmholtz theorem cited in Section 1.3.2. Here,

$$
\mathbf{F} ^{\perp} (\mathbf{r}) \equiv \frac{1}{4 \pi} \nabla \times \nabla \times \int d^{3} r^{\prime} \frac{\mathbf{F} (\mathbf{r} ^{\prime})}{| \mathbf{r} - \mathbf{r} ^{\prime} |},\tag{B.4}
$$

$$
\mathbf{F} ^{\parallel} (\mathbf{r}) \equiv - \frac{1}{4 \pi} \nabla \int d^{3} r^{\prime} \frac{\nabla^{\prime} \cdot \mathbf{F} (\mathbf{r} ^{\prime})}{| \mathbf{r} - \mathbf{r} ^{\prime} |},\tag{B.5}
$$

and, obviously, $\nabla \cdot \mathbf{F} ^{\perp} = 0$ , and $\nabla \times \mathbf{F} ^{\parallel} = 0$ , since the divergence of a curl and the curl of a gradient are both zero. These equations uniquely identify the transverse and longitudinal parts of an arbitrary vector field $\mathbf{F} ( \mathbf{r} )$

The transverse and longitudinal parts of F can also be expressed as follows, using the summation convention for repeated indices:

$$
F_{i} ^{\perp} (\mathbf{r}) = \int d^{3} r^{\prime} \delta_{i j} ^{\perp} (\mathbf{r} - \mathbf{r} ^{\prime}) F_{j} (\mathbf{r} ^{\prime}),\tag{B.6}
$$

and

$$
F_{i} ^{\parallel} (\mathbf{r}) = \int d^{3} r^{\prime} \delta_{i j} ^{\parallel} (\mathbf{r} - \mathbf{r} ^{\prime}) F_{j} (\mathbf{r} ^{\prime}),\tag{B.7}
$$

where the transverse and longitudinal delta functions (tensors) are defined by

$$
\delta_{i j} ^{\perp} (\mathbf{r}) = \left(\frac{1}{2 \pi}\right) ^{3} \int d^{3} k \left(\delta_{i j} - \frac{k_{i} k_{j}}{k^{2}}\right) e^{i \mathbf{k} \cdot \mathbf{r}},\tag{B.8}
$$

$$
\delta_{i j} ^{\parallel} (\mathbf{r}) \equiv \left(\frac{1}{2 \pi}\right) ^{3} \int d^{3} k \frac{k_{i} k_{j}}{k^{2}} e^{i \mathbf{k} \cdot \mathbf{r}},\tag{B.9}
$$

from which it follows by carrying out the integrations that

$$
\delta_{i j} ^{\perp} (\mathbf{r}) + \delta_{i j} ^{\parallel} (\mathbf{r}) = \delta_{i j} \delta^{3} (\mathbf{r}),\tag{B.10}
$$

$$
\delta_{i j} ^{\perp} (\mathbf{r}) = \frac{2}{3} \delta_{i j} \delta^{3} (\mathbf{r}) - \frac{1}{4 \pi r^{3}} \left(\delta_{i j} - \frac{3 r_{i} r_{j}}{r^{2}}\right),\tag{B.11}
$$

$$
\delta_{i j} ^{\parallel} (\mathbf{r}) = \frac{1}{3} \delta_{i j} \delta^{3} (\mathbf{r}) + \frac{1}{4 \pi r^{3}} \left(\delta_{i j} - \frac{3 r_{i} r_{j}}{r^{2}}\right).\tag{B.12}
$$

We can prove (B.6), for instance, by showing that $\nabla \cdot \mathbf{F} ^{\perp} ( \mathbf{r} ) = 0$ , that is, $\partial F_{i} ^{\perp} ( \mathbf{r} ) / \partial x_{i} =$ 0:

$$
\begin{array}{l} \frac{\partial F_{i} ^{\perp} (\mathbf{r})}{\partial x_{i}} = \frac{\partial}{\partial x^{i}} \int d^{3} r^{\prime} \delta_{i j} ^{\perp} (\mathbf{r} - \mathbf{r} ^{\prime}) F_{j} (\mathbf{r} ^{\prime}) \\ \qquad = \left(\frac{1}{2 \pi}\right) ^{3} \frac{\partial}{\partial x_{i}} \int d^{3} r^{\prime} \int d^{3} k \left(\delta_{i j} - \frac{k_{i} k_{j}}{k^{2}}\right) e^{i \mathbf{k} \cdot (\mathbf{r} - \mathbf{r} ^{\prime})} F_{j} (\mathbf{r} ^{\prime}) \\ \qquad = \left(\frac{1}{2 \pi}\right) ^{3} \int d^{3} r^{\prime} \int d^{3} k \left(\delta_{i j} - \frac{k_{i} k_{j}}{k^{2}}\right) i k_{i} e^{i \mathbf{k} \cdot (\mathbf{r} - \mathbf{r} ^{\prime})} F_{j} (\mathbf{r} ^{\prime}) \\ \qquad = i \left(\frac{1}{2 \pi}\right) ^{3} \int d^{3} r^{\prime} \int d^{3} k [ \mathbf{k} \cdot \mathbf{F} (\mathbf{r} ^{\prime}) - \mathbf{k} \cdot \mathbf{F} (\mathbf{r} ^{\prime}) ] e^{i \mathbf{k} \cdot (\mathbf{r} - \mathbf{r} ^{\prime})} = 0. \end{array}\tag{B.13}
$$

Note that $\delta_{i j} ^{\perp} ( \mathbf{r} )$ and $\delta_{i j} ^{\parallel} ( \mathbf{r} )$ , unlike $\delta^{3} ( \mathbf{r} )$ , do not vanish for $\mathbf{r} \neq 0$

Exercise B.1: (a) Let $\mathbf{A} ( \mathbf{r} )$ and $\mathbf{B} ( \mathbf{r} )$ be two vector fields. Show that

$$
\int d^{3} r \mathbf{A} ^{\perp} (\mathbf{r}) \cdot \mathbf{B} ^{\parallel} (\mathbf{r}) = 0,
$$

$$
\int d^{3} r \mathbf{A} ^{\perp} (\mathbf{r}) \cdot \mathbf{B} ^{\perp} (\mathbf{r}) = \int d^{3} r \mathbf{A} ^{\perp} (\mathbf{r}) \cdot \mathbf{B} (\mathbf{r}),
$$

$$
\int d^{3} r \mathbf{A} ^{\parallel} (\mathbf{r}) \cdot \mathbf{B} ^{\parallel} (\mathbf{r}) = \int d^{3} r \mathbf{A} ^{\parallel} (\mathbf{r}) \cdot \mathbf{B} (\mathbf{r}).
$$

(b) Using the general expression above for the transverse part of a vector field, show that the transverse part of the vector potential A is gauge-invariant.

## C. Photodetection, Normal Ordering, and Causality

Consider first a two-state atom, initially in its lower eigenstate $| g \rangle$ of energy $E_{g} ,$ interacting with a field initially in a state $| I \rangle$ . The probability that, at time t, the atom is in its upper eigenstate of energy $E_{e}$ and the field is in a state $| F \rangle$ is given in second-order perturbation theory by (2.1.17) with the (interaction-picture) interaction Hamiltonian

$$
h_{I} (t) = - \mathbf{d} (t) \cdot \mathbf{E} (\mathbf{r}, t),\tag{C.1}
$$

$$
\mathbf{d} (t) = e^{- i \omega_{e g} t} \mathbf{d} _{g e} \boldsymbol{\sigma} + e^{i \omega_{e g} t} \mathbf{d} _{e g} \boldsymbol{\sigma} ^{\dagger},\tag{C.2}
$$

$$
\mathbf{E} (\mathbf{r}, t) = \mathbf{E} ^{(+)} (\mathbf{r}, t) + \mathbf{E} ^{(-)} (\mathbf{r}, t),\tag{C.3}
$$

$$
\mathbf{E} ^{(+)} (\mathbf{r}, t) = \sum_{\beta} C_{\beta} a_{\beta} e^{- i \omega_{\beta} t} \mathbf{A} _{\beta} (\mathbf{r}),\tag{C.4}
$$

Photodetection, Normal Ordering, and Causality

$$
\mathbf{E} ^{(-)} (\mathbf{r}, t) = \sum_{\beta} C_{\beta} ^{*} a_{\beta} ^{\dagger} e^{i \omega_{\beta} t} \mathbf{A} _{\beta} ^{*} (\mathbf{r}).\tag{C.5}
$$

Here, $\omega_{e g} = ( E_{e} - E_{g} ) / \hbar > 0$ , σ and $\sigma^{\dagger}$ are, as usual, the two-state lowering and raising operators, and r denotes the position of the atom. $\mathbf{E} ^{( + )} ( \mathbf{r} , t )$ and $\mathbf{E} ^{( - )} ( \mathbf{r} , t )$ are, respectively, the positive- and negative-frequency parts of the electric field operator, which has been expressed as an expansion in mode functions $\mathbf{A} _{\beta}$ . Since $\langle e | \sigma | g \rangle = 0$ $\langle e | \sigma^{\dagger} | g \rangle = \langle e | e \rangle = 1 , | i \rangle = | g \rangle | I \rangle$ and $| f \rangle = | e \rangle | F \rangle$ ,

$$
\int_{0} ^{t} d t^{\prime} \langle f | h_{I} (t^{\prime} | i \rangle = - \int_{0} ^{t} d t^{\prime} e^{i \omega_{e g} t^{\prime}} \mathbf{d} _{e g} \cdot \langle F | \mathbf{E} (\mathbf{r}, t^{\prime}) | I \rangle\tag{C.6}
$$

and<sup>1</sup>

$$
p_{i \rightarrow f} (t) = \frac{1}{\hbar^{2}} \int_{0} ^{t} d t^{\prime} \int_{0} ^{t} d t^{\prime \prime} d_{g e, \mu} d_{e g, \nu} \bigl \langle I | E_{\mu} (\mathbf{r}, t^{\prime \prime}) | F \rangle \langle F | E_{\nu} (\mathbf{r}, t^{\prime}) | I \rangle e^{i \omega_{e g} (t^{\prime} - t^{\prime \prime})}.\tag{C.7}
$$

Summing over all possible final field states $| F \rangle$ , assuming there is no discrimination among them in a measurement, and using the completeness relation $| F \rangle \langle F | = 1$ , we replace (C.7) by

$$
p^{(1)} (t) \equiv \frac{1}{\hbar^{2}} \int_{0} ^{t} d t^{\prime} \int_{0} ^{t} d t^{\prime \prime} d_{g e, \mu} d_{e g, \nu} \bigl \langle E_{\mu} (\mathbf{r}, t^{\prime \prime}) E_{\nu} (\mathbf{r}, t^{\prime}) \bigr \rangle e^{i \omega_{e g} (t^{\prime} - t^{\prime \prime})},\tag{C.8}
$$

in which the expectation value $\langle E_{\mu} ( t^{\prime \prime} ) E_{\nu} ( t^{\prime} ) \rangle = \langle I | E_{\mu} ( {\bf r} , t^{\prime \prime} ) E_{\nu} ( {\bf r} , t^{\prime} ) | I \rangle$ refers to the initial state of the field.

We now modify this result of second-order perturbation theory to allow for a continuum of possible (photo-)electron states $| e \rangle$ , assuming an energy distribution function $P ( E_{e} )$ for these states:

$$
\begin{array}{l} p^{(1)} (t) = \frac{1}{\hbar^{2}} \int_{0} ^{\infty} d E_{e} P (E_{e}) d_{e g, \mu} ^{*} d_{e g, \nu} \\ \qquad \times \int_{0} ^{t} d t^{\prime} \int_{0} ^{t} d t^{\prime \prime} \big \langle E_{\mu} (\mathbf{r}, t^{\prime \prime}) E_{\nu} (\mathbf{r}, t^{\prime}) \big \rangle e^{i \omega_{e g} (t^{\prime} - t^{\prime \prime})}. \end{array}\tag{C.9}
$$

This expression does not allow for any possibility that the electron can make a transition from a state $| e \rangle$ back to the initial bound state $| g \rangle$ . It therefore serves to model, for example, a photodetector based on the photoelectric efect.

If the electric field acting on the atom were monochromatic,

$$
E_{\mu} (\mathbf{r}, t) = \frac{1}{2} \big [ E_{\mu} ^{(+)} (\mathbf{r}) e^{- i \omega t} + E_{\mu} ^{(-)} (\mathbf{r}) e^{i \omega t} \big ],\tag{C.10}
$$

we would replace (C.9) by

$$
\begin{array}{l} p^{(1)} (t) = \frac{1}{\hbar^{2}} \int_{0} ^{\infty} d E_{e} P (E_{e}) d_{e g, \mu} ^{*} d_{e g, \nu} \big \langle E_{\mu} ^{(-)} (\mathbf{r}) E_{\nu} ^{(+)} (\mathbf{r}) \big \rangle \\ \times \int_{0} ^{t} d t^{\prime} \int_{0} ^{t} d t^{\prime \prime} e^{i (\omega_{e g} - \omega) (t^{\prime} - t^{\prime \prime})}. \end{array}\tag{C.11}
$$

Then, $p^{( 1 )} ( t )$ varies in time as

$$
\int_{0} ^{t} d t^{\prime} \int_{0} ^{t} d t^{\prime \prime} e^{i (\omega_{e g} - \omega) (t^{\prime} - t^{\prime \prime})} = \frac{\sin^{2} [ (\omega_{e g} - \omega) t / 2 ]}{[ (\omega_{e g} - \omega) / 2 ] ^{2}},\tag{C.12}
$$

which leads to a rate of excitation $d p^{( 1 )} / d t$ given by Fermi’s golden rule (see Section 2.3).

More generally, if the electric field is slowly varying in time compared to $\mathrm{e x p} ( i \omega_{e g} t )$ for frequencies $\omega_{e g}$ that contribute significantly to (C.9), we replace (C.9) by

$$
\begin{array}{l} p^{(1)} (t) = \frac{1}{\hbar^{2}} \int_{0} ^{\infty} d E_{e} P (E_{e}) d_{e g, \mu} ^{*} d_{e g, \nu} \int_{0} ^{t} d t^{\prime} \int_{0} ^{t} d t^{\prime \prime} \left\langle E_{\mu} ^{(-)} (\mathbf{r}, t^{\prime \prime}) E_{\nu} ^{(+)} (\mathbf{r}, t^{\prime}) \right\rangle e^{i \omega_{e g} (t^{\prime} - t^{\prime \prime})} \\ = \int_{0} ^{t} d t^{\prime \prime} \int_{0} ^{t} d t^{\prime} S_{\mu \nu} (t^{\prime} - t^{\prime \prime}) \left\langle E_{\mu} ^{(-)} (\mathbf{r}, t^{\prime \prime}) E_{\nu} ^{(+)} (\mathbf{r}, t^{\prime}) \right\rangle , \end{array} \tag{C.13}
$$

$$
S_{\mu \nu} (t) \equiv \frac{1}{\hbar^{2}} \int_{0} ^{\infty} d E_{e} P (E_{e}) d_{e g, \mu} ^{*} d_{e g, \nu} e^{i \omega_{e g} t}.\tag{C.14}
$$

In this approximation the photodetection probability depends on the normally ordered field correlation function $\bar{\langle E_{\mu} ^{( - )} ( t^{\prime \prime} ) E_{\nu} ^{( + )} ( t^{\prime} ) \rangle}$ . Another approximation, often made in theoretical discussions, is based on the assumption that the photodetection is insensitive to $d_{e g , \mu} ^{*} d_{e g , \nu}$ and to the frequencies $\omega_{e g}$ within the bandwidth of the applied field; actual detectors at optical frequencies can approximate fairly well such an “ideal broadband detector.” In this approximation,

$$
S_{\mu \nu} (t) \propto \frac{1}{\hbar^{2}} d_{e g, \mu} ^{*} d_{e g, \nu} \int_{- \infty} ^{\infty} d \omega_{e g} e^{i \omega_{e g} t} \equiv s_{\mu \nu} \delta (t),\tag{C.15}
$$

$$
p^{(1)} (t) \cong s_{\mu \nu} \int_{0} ^{t} d t^{\prime} \bigl \langle E_{\mu} ^{(-)} (\mathbf{r}, t^{\prime}) E_{\mu} ^{(+)} (\mathbf{r}, t^{\prime}) \bigr \rangle ,\tag{C.16}
$$

and we define a rate

$$
R^{(1)} (t) = \frac{d}{d t} p^{(1)} (t) = s_{\mu \nu} \bigl \langle E_{\mu} ^{(-)} (\mathbf{r}, t) E_{\nu} ^{(+)} (\mathbf{r}, t) \bigr \rangle \equiv s_{\mu \nu} G_{\mu \nu} ^{(1)} (\mathbf{r}, t; \mathbf{r}, t).\tag{C.17}
$$

The first-order field correlation function

$$
G_{\mu \nu} ^{(1)} (\mathbf{r} _{1}, t_{1}; \mathbf{r} _{2}, t_{2}) \equiv \big \langle E_{\mu} ^{(-)} (\mathbf{r} _{1}, t_{1}) E_{\nu} ^{(+)} (\mathbf{r} _{2}, t_{2}) \big \rangle ,\tag{C.18}
$$

as defined in Section 3.9 for a single vector component of the electric field. The main assumption in the derivation of (C.13) and (C.17) is the applicability of second-order perturbation theory, which implies an irreversible transition of electrons from a ground state to a continuum of possible final states. The replacement of the electric field correlation function $\langle E_{\mu} ( {\bf r} , t^{\prime \prime} ) E_{\nu} ( {\bf r} , t^{\prime} ) \rangle$ by the normally ordered correlation function $\langle E_{\mu} ^{( - )} ( \mathbf{r} , t^{\prime \prime} ) E_{\nu} ^{( + )} ( \mathbf{r} , t^{\prime} ) \rangle$ is an approximation of exactly the type used in the derivation of Fermi’s golden rule for a transition rate (see Section 2.3).

Exercise C.1: Show that a hypothetical photodetection system based on stimulated emission rather than absorption responds to an anti-normal-ordered field correlation function.

Application of (C.13) and (C.17) to an actual photodetector requires integration over the positions r of the detector atoms, and account of practical efects such as reflections at the detector surface. For a nearly ideal broadband detector, the rate obtained from (C.17) would be proportional to the rate at which electrons are irreversibly removed from their initial ground states; in a photomultiplier, for example, this would be proportional to the electric current generated by the applied field. We will conclude our simplified treatment with some remarks relating to normal ordering, causality, and the vacuum field.

The electric field in (C.9), of course, satisfies the condition that a source of radiation turned on at a time $t = 0$ at a distance R from a detector atom cannot afect the atom before a time $t = R / c$ . The fields $\mathbf{E} ^{( \pm )} ( \mathbf{r} , t )$ , however, are not retarded in this sense. The appearance of the normally ordered correlation $\langle E_{\mu} ^{( - )} ( \mathbf{r} , t^{\prime \prime} ) E_{\nu} ^{( + )} ( \mathbf{r} , t^{\prime} ) \rangle$ in photodetection theory might therefore imply, at first glance, a violation of causality. However, the replacement of $\langle E_{\mu} ( {\bf r} , t^{\prime \prime} ) E_{\nu} ( {\bf r} , t^{\prime} ) \rangle$ by the normally ordered correlation $\langle E_{\mu} ^{( - )} ( \mathbf{r} , t^{\prime \prime} ) E_{\nu} ^{( + )} ( \mathbf{r} , t^{\prime} ) \rangle$ is clearly an approximation. The situation here is essentially the same as in the discussion in Section 7.9.3 of causality in the dipole interaction of two atoms. It is only when “energy-non-conserving,” negative-frequency contributions to the interaction are included in the calculation that the interaction is found to be causal in the sense that the initially unexcited atom can only be excited after the time it takes for the field from the initially excited atom to reach it; in the approximation made by Fermi, these negative-frequency contributions were included by extending an integration to include all negative as well as all positive field frequencies. In the Heisenberg-picture calculation given in Section 7.9.1, similarly, we began with the fully retarded electric field from an atom and then identified a fully retarded expression (7.9.37) for its positive-frequency part in a rotating-wave approximation. The same approach can be employed in the present context to modify (C.13) and (C.17) to explicitly include retardation, although, as a practical matter, this is hardly necessary.<sup>2</sup>

Because of the normal ordering of field operators in (C.13) and (C.17), there is no contribution from the vacuum field. The same cannot be said for (C.9), which appears to include unphysical vacuum-field contributions $\langle a_{\beta} a_{\beta} ^{\dagger} \rangle$ . However, the total field acting on an atom at r in our model is

$$
\mathbf{E} (\mathbf{r}, t) = \mathbf{E} _{0} (\mathbf{r}, t) + \mathbf{E} _{\mathrm{RR}} (\mathbf{r}, t) + \mathbf{E} _{\mathrm{ext}} (\mathbf{r}, t),\tag{C.19}
$$

in which $\mathbf{E} _{0} ( \mathbf{r} , t )$ is the source-free, vacuum field, $\mathbf{E} _{\mathrm{R R}} ( \mathbf{r} , t )$ is the radiation reaction field, and $\mathbf{E} _{\mathrm{e x t}} ( \mathbf{r} , t )$ is the field from sources external to the detector atom. As discussed in Chapter 4, the only efect of $\mathbf{E} _{0} ( \mathbf{r} , t ) \ + \ \mathbf{E} _{\mathrm{R R}} ( \mathbf{r} , t )$ on a ground-state atom is a radiative frequency shift. The only field that can cause an atomic electron to make a transition out of the ground state is therefore $\mathbf{E} _{\mathrm{e x t}} ( \mathbf{r} , t )$ , and it is only this field that contributes to (C.13) and (C.17). In other words, the field appearing in these expressions should be understood to be $\mathbf{E} _{\mathrm{e x t}} ( \mathbf{r} , t )$

Photodetection theory for two or more detectors at diferent positions and times can be modeled in essentially the same way, leading to higher-order field correlation functions such as the second-order correlation function (see Section 3.9)<sup>3</sup>

$$
\begin{array}{r l} & G_{i j k \ell} ^{(2)} (\mathbf{r} _{1}, t_{1}; \mathbf{r} _{2}, t_{2}; \mathbf{r} _{3}, t_{3}; \mathbf{r} _{4}, t_{4}) = \big \langle E_{i} ^{(-)} (\mathbf{r} _{1}, t_{1}) E_{j} ^{(-)} (\mathbf{r} _{2}, t_{2}) \\ & \qquad \times E_{k} ^{(+)} (\mathbf{r} _{3}, t_{3}) E_{\ell} ^{(+)} (\mathbf{r} _{4}, t_{4}) \big \rangle , \end{array}\tag{C.20}
$$

which we used in the theory of photon bunching (Section 3.9) and anti-bunching (see Section 5.7) and in the calculation of photon polarization correlations (see Section 5.8).

