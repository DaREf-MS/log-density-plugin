package org.example;

import java.util.ArrayList;
import java.util.List;
import java.util.Objects;

class MyBlock {
    int logLines;
    int loc;
    String type;
    String content;
    int methodStart;
    int blockStart;
    int blockEnd;
    boolean isLogged;
    double logDensity;
    int logLevel; // 0 -> 4 (Trace, Debug, Info, Warn, Error)
    List<String> semanticFeatures;
    List<String> syntacticFeatures;

    public MyBlock(String type, int methodStart, int blockStart, int blockEnd) {
        this.type = type;
        this.methodStart = methodStart;
        this.blockStart = blockStart;
        this.blockEnd = blockEnd;
        this.semanticFeatures = new ArrayList<>();
        this.syntacticFeatures = new ArrayList<>();
    }

    @Override
    public String toString() {
        return "Block " + type + " : " + blockStart + " - " + blockEnd + " (Method start : " + methodStart + ")" + "\n" +
                "SemanticFeatures : " + semanticFeatures + "\n" +
                "SyntacticFeatures : " + syntacticFeatures;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        MyBlock block = (MyBlock) o;
        return methodStart == block.methodStart && blockStart == block.blockStart && blockEnd == block.blockEnd && type == block.type && semanticFeatures.size() == block.semanticFeatures.size() && syntacticFeatures.size() == block.syntacticFeatures.size();
    }

}