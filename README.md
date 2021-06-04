# Language-annotated Abstraction and Reasoning Corpus (LARC)

This is the anonymized submission github.

This repository contains the language annotated data with supporting assets for LARC

*"How can we build intelligent systems that achieve human-level performance on challenging and structured domains (like ARC), with or without additional human guidance? We posit the answer may be found in studying natural programs - instructions humans give to each other to communicate how to solve a task. Like a computer program, these instructions can be reliably "executed" by others to produce intended outputs."*

A comprehensive view of this dataset and its goals can be found in future-paper-link

Annotations in LARC takes the form of a communication game, where 
one participant, the *describer* solves an ARC task and describes the solution to a different participant, 
the *builder*, who must solve the task on the new input using the description alone. 

<p align="center">
<img src="https://raw.githubusercontent.com/samacqua/LARC/main/assets/collection.jpg" alt="drawing" width="75%"/>
</p>

The entire dataset can be browsed by downloading this entire project, and spin up a server at the root directory `python3 -m http.server`
and typing `localhost:8000/explore/` into chrome.

The original ARC data can be found here [The Abstraction and Reasoning Corpus](https://github.com/fchollet/ARC)

## Contents
- `dataset` contains the language-annotated ARC tasks and successful natural program phrase annotations
- `explorer` contains the explorer code that allows for easy browsing of the annotated tasks
- `collection` contains the source code used to curate the dataset
- `bandit` contains the formulation and environment for bandit algorithm used for collection

