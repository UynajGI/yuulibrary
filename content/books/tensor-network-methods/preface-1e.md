---
title: "第一版前言"
weight: 3
description: "张量网络方法从多体量子物理到量子技术的入门指南。"
---

# Preface to the First Edition

In the last years, a number of theoretical and numerical tools have been developed by a thriving community formed by people coming from different backgrounds— condensed matter, quantum optics, quantum information, high-energy, and highperformance computing—which are opening new paths towards the exploration of correlated quantum matter. The field I have the pleasure to work in is mostly based and supported by the numerical simulation performed via Tensor Network Methods, which sprang from the Density Matrix Renormalization Group, introduced by S. White more than twenty years ago. White’s contribution, as the name itself suggests, was based on the powerful theoretical construction introduced in the seventies on the Renormalization Group and critical phenomena by K. Wilson. After a first decade where Density Matrix Renormalization Group has been applied mostly in condensed matter physics, starting from the new millennium, Tensor Network Methods have been developed and adapted to a constantly increasing number of research fields, ranging from quantum information and quantum chemistry to lattice gauge theories.

This book contains the notes of the course I delivered at Ulm University from 2010 to 2016 on computational quantum physics. I planned the course trying to fulfil two very demanding requirements. From the one hand, it is structured in such a way that a student would be able to follow it, even without previous knowledge on programming, scientific calculations and only knowing the basics of the underlying theory, that is, a basic course in quantum mechanics. On the other hand, I aimed not only to introduce the students to the fascinating field of computational physics, but also to achieve that, at the end of the course, they could being able to attack one of the main open problem in modern physics—the quantum many-body problem. Thus, I designed a course that would bring the interested students from the very first steps into the world of computational physics to its cutting edge, at the point where they could—with a little additional effort—dive in into the world of research. Indeed, a student that would take such a challenge with a proper knowhow, will surely have plenty occasions to enjoy this fast expanding field and will belong to an exciting and growing community. In the last ten years, I have already witnessed many students that are succeeding in such process, which resulted in many fruitful scientific collaborations and interesting publications.

The book is structured in parts, each of them divided in chapters, according to the original plan of the course. The first part and the appendices introduce the basic concepts needed in any computational physics courses: software and hardware, programming guidelines, linear algebra and differential calculus. They are presented in a self consistent way and accompanied by exercises that will make it easer to climb the steepest learning curve of the second part of the course. The central part presents the core of the course, focus on Tensor Network methods. Although in my course I briefly introduced also other successful numerical approaches (Monte Carlo, Hartree-Fock, Density functional theory, etc.) they are not included here as many excellent books present them, much better than what I could do here in a limited space. Next, I introduce elements of group theory and the consequences of symmetries in the correlated quantum world and on tensor networks. From the one hand, the appearance of different phase of matter, of spontaneous symmetry breaking and quantum phase transitions where correlations diverge, present the highest difficulties for their numerical description. On the other hand, symmetries can be exploited to simplify the system description and to speed up the computation: Symmetric tensor networks are fundamental to be able to perform state-of-theart simulations. This is indeed true for global symmetries like the conservation of particles number in fermionic and bosonic systems or the magnetization in spin systems. However, recently it has been shown that also gauge symmetries can be embedded in the tensor network description, paving the way to very efficient simulation of lattice gauge theories, which are going to impact the modern research in condensed matter theory and high energy physics. Finally, the last part reviews the applications of the tools introduced here to the study of phases of quantum matter and their characterization by means of correlation functions and entanglement measures. Moreover, I present some results on out-of-equilibrium phenomena, such as adiabatic quantum computation, the Kibble-Zurek mechanism, and the application of quantum optimal control theory to many-body quantum dynamics.

In conclusion, this book can be used as a textbook for graduate computational quantum physics courses. Every chapter ends with exercises, most of which has been designed as weekly exercise for the students, to be evaluated in terms of programming, analysis and presentation of the results. At the end of the course, the students should be able to write a tensor network program to begin to explore the physics of many-body quantum systems. The course closed with each student choosing a final project to be performed in one month: the subject could also be related to other exams or laboratory activities, preparation for their Master Thesis or as a part of their Ph.D. studies. Indeed, the scope of the course was to prepare them to these challenges, and in most cases they demonstrated the success of such program.

The contents presented here are unavoidably based on my particular view of the field, and in particular the focus is on the recent development of Tensor Network method I had the pleasure to participate in. Most of the contents, as acknowledge hereafter, are based on excellent books, review and research papers of collaborators and colleagues in the field. However, to the best of my knowledge, at the time I am writing these lines, there is nowhere a self-contained book presenting all the elements needed to train students to work with Tensor Network Method, despite the growing request of Ph.D. students with such skills. Finally, I think that this book could serve as a useful reference and guide to relevant literature for researchers working in the field; or as a starting point for colleagues that are entering in it.

I would like to thank the many people that made this possible and that accompanied my life and scientific career until now. The colleagues at Ulm, J. Ankerhold, M. Freyberger, J. Hecker-Denschlag, S. Huelga, F. Jelezko, B. Nayedov, M. Plenio, F. Schmidt-Kaler, J. Stockburger, and W. Schleich, made Ulm University a special and unique place to develop new scientific research. The support of the Center for Integrated Quantum Science & Technologies and of its director T. Calarco have been very precious in these last years. The scientific discussions with the other IQST fellows in Ulm and Stuttgart have been a very important stimulus.

The Institute for Quantum Optics and Quantum Information of the Austrian Academy of Science in Innsbruck played a unique role in my scientific life in the last years: especially since I became an IQOQI visiting fellow, I could fully profit from their hospitality and inspiration full environment. I am greatly thankful to Peter Zoller for his friendly guidance, his availability, and the many enjoyable discussions.

A special thank to Giovanna Morigi that always supported me and to Saarland University that hosted my Heisenberg Fellowship. It has been a very fruitful and exciting time in a very pleasant environment: I am sure it will bring to a longstanding successful scientific collaboration.

The colleagues involved in the QUANTERA project I have the pleasure to coordinate (QTFLAG) are working hard to develop the next generation of tensor network methods and experiments to investigate lattice gauge theories. I am sure that in the years to come they will inspire many of the readers of this book and myself with new exciting ideas and tools: many thanks to M. Dalmonte, I. Cirac, E. Rico, M. Lewenstein, F. Verstraete, U.-J. Wiese, L. Tagliacozzo, M.-C. Bañuls, K. Jansen, A. Celi, B. Reznik, R. Blatt, L. Fallani, J. Catani, C. Muschik, J. Zakrzewski, K. Van Acoleyen, and M. Wingate.

This book could not have been written without the many persons that spent some years working with me, making my everyday life full of stimuli. I would like to thank P. Silvi, F. Tschirsich, D. Jaschke, M. Gerster, T. Felser, L. Kohn, Y. Sauer, H. Wegener, F. Schrodi, J. Zoller, M. Keck, T. Pichler, N. Rach, R. Said, J. Cui, V. Mukherjee, M. Müller, W. Weiss, A. Negretti, I. Brouzos, T. Caneva, D. Bleh, M. Murphy, and P. Doria, for the uncountable hours of good physics.

In the last twenty years, I had the pleasure to collaborate with many other persons that, in different ways, have been present during my career development and showed me different interesting points of view: I am greatly thankful to G. Benenti, G. Casati, M. Rizzi, G. De Chiara, G. Santoro, D. Rossini, M. Palma, P. Falci, E. Paladino, F. Cataliotti, S. Pascazio, J. Prior, F. Illuminati, L. Carr, P. Zanardi, G. Pupillo, S. Lloyd, R. Onofrio, M. Lukin, L. Viola, J. Schmiedmayer, M. Tusk and to many others not included here. In addition to being always there, Saro Fazio also has the merit to be the first to point to me the original papers on the density matrix renormalization group. From that discussion many years ago at Scuola Normale Superiore, a lot of exciting developments followed, and many others are still in sight.

Finally, it would not be possible for me to concentrate on my research without the full support of my family that every day gives me the strength of pursuing new challenges. Thank you, I owe you all. A huge thank to C. Montangero for his help in improving the computer science part of the text, once more renovating the never-ending scientific confrontation between physicist and computer scientists, here enriched by a father-son debate. We did pretty well. With the advent of quantum technologies, I am sure there will be plenty of other occasions to keep on this enriching dispute between these two branches of science.

Despite the feedback I received on the draft from many colleagues, the remaining errors and typos in the text are my sole responsibility. I will appreciate any comment or feedback to improve the book in the future.

Ulm, Germany July 2018

Simone Montangero

Introduction . . .
Timo Felser and Simone Montangero
Part I Prologue
Simone Montangero
Simone Montangero
Part II The Many-body Problem
Simone Montangero
Timo Felser and Simone Montangero
Simone Montangero
Part III Implementation of Tensor Networks
Timo Felser and Simone Montangero
7.2.1 Time-dependent Density Matrix
Renormalization Group 107
Timo Felser
8.2.1 Two-Dimensional TTN Structure and Hamiltonian
Mapping. 128
Timo Felser
Part IV Applications
Simone Montangero
Giovanni Cataldi
11.4.5 Hardcore-Gluon Model: Minimally Truncated
Gauge-Fields . 233
Simone Montangero
Timo Felser
A.1 Architecture. . 275
A.2 Data and Formats . 276
A.3 Memory and Data Processing. 280
A.4 Multiprocessors. 282
A.5 Problems 285
B.1 Correctness . 288
B.2 Numerical Stability. 291
B.3 Accurate Discretization . 292
B.4 Flexibility 295
B.5 Efficiency 300
B.6 Problems . 301
References. 303
